import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import ts from "typescript";
import { formatStylesheet } from "./lib/css-format";
import { viewportCssProblems } from "./lib/viewport-css-audit";

const root = process.cwd();
const files = [...new Bun.Glob("src/**/*.{ts,tsx,js,mjs}").scanSync()].filter((file) => !/\.(test|d)\.ts$/.test(file)).sort();
const modules = new Map(files.map((file) => [resolve(file), ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true)]));
const errors: string[] = [];
const fail = (file: string, reason: string) => errors.push(`${file}: ${reason}`);
const isClient = (sourceFile: ts.SourceFile) => sourceFile.statements.some((node) => ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === "use client");
const runtimeImports = (sourceFile: ts.SourceFile) => {
  const imports: string[] = [];
  for (const node of sourceFile.statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      if (clause?.isTypeOnly) continue;
      const bindings = clause?.namedBindings;
      if (clause && !clause.name && bindings && ts.isNamedImports(bindings) && bindings.elements.length && bindings.elements.every((element) => element.isTypeOnly)) continue;
      imports.push(node.moduleSpecifier.text);
    } else if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements.length && node.exportClause.elements.every((element) => element.isTypeOnly)) continue;
      imports.push(node.moduleSpecifier.text);
    }
  }
  return imports;
};
const localImport = (file: string, specifier: string) => {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const base = specifier.startsWith("@/") ? resolve(root, "src", specifier.slice(2)) : resolve(dirname(file), specifier);
  const choices = [base, ...[".ts", ".tsx", ".js", ".mjs", ".json"].map((suffix) => base + suffix), resolve(base, "index.ts"), resolve(base, "index.tsx")];
  if (extname(base) === ".js") choices.push(base.slice(0, -3) + ".ts", base.slice(0, -3) + ".tsx");
  const found = choices.find((choice) => existsSync(choice) && statSync(choice).isFile());
  if (!found) fail(file, `unresolved local import ${specifier}`);
  return found ?? null;
};
const prohibited = /^(?:gsap|lenis|@react-three\/[^/]+)(?:\/|$)/;
const heavy = /^(?:three|troika-three-text)(?:\/|$)/;
const clients = [...modules].filter(([, sourceFile]) => isClient(sourceFile)).map(([file]) => file);
const visited = new Set<string>();
function initialGraph(file: string, chain: string[]) {
  if (visited.has(file)) return;
  visited.add(file);
  const sourceFile = modules.get(file);
  if (!sourceFile) return;
  for (const specifier of runtimeImports(sourceFile)) {
    if (specifier === "server-only" || heavy.test(specifier)) fail(file, `initial client graph reaches ${specifier} via ${chain.join(" → ")}`);
    const target = localImport(file, specifier);
    if (!target) continue;
    if (target.includes("/i18n/locales/") || /journey-(en|ar)\.json$/.test(target)) fail(file, `client graph imports server content ${specifier}`);
    if (/\.animate\.[tj]sx?$|\/lib\/audio\//.test(target)) fail(file, `initial client graph statically imports deferred controller ${specifier}`);
    initialGraph(target, [...chain, specifier]);
  }
}
for (const file of clients) initialGraph(file, [file.slice(root.length + 1)]);
const serverVisited = new Set<string>();
function serverGraph(file: string) {
  if (serverVisited.has(file)) return;
  serverVisited.add(file);
  const sourceFile = modules.get(file);
  if (!sourceFile || isClient(sourceFile)) return;
  for (const specifier of runtimeImports(sourceFile)) {
    if (heavy.test(specifier)) fail(file, `server content graph imports browser graphics runtime ${specifier}`);
    const target = localImport(file, specifier);
    if (target) serverGraph(target);
  }
}
for (const [file] of modules) if (file.includes("/src/app/")) serverGraph(file);
for (const [file, sourceFile] of modules) {
  if (/\/app\/(?:\[locale\]\/)?(?:page|layout)\.tsx$/.test(file) && isClient(sourceFile)) fail(file, "route composition must stay on the server");
  if (/\.animate\.ts$/.test(file) && runtimeImports(sourceFile).includes("react")) fail(file, "imperative animation controller imports React at runtime");
  const inspect = (node: ts.Node) => {
    if (ts.isStringLiteral(node) && (prohibited.test(node.text) || node.text === "__bouthouriLenis")) fail(file, `prohibited runtime ${node.text}`);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["uiStore", "dimensionsStore"].includes(node.expression.text)) fail(file, "React subscriptions must use the use-prefixed Storio alias");
    ts.forEachChild(node, inspect);
  };
  inspect(sourceFile);
}
const css = [...new Bun.Glob("src/**/*.css").scanSync()].sort();
for (const file of css) {
  const source = readFileSync(file, "utf8");
  if (formatStylesheet(source, file) !== source) fail(file, "run bun run format:css for one-line selector formatting");
  for (const problem of viewportCssProblems(source)) fail(file, problem);
}
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
for (const name of Object.keys(manifest.dependencies)) if (prohibited.test(name)) fail("package.json", `prohibited dependency ${name}`);
assert.equal(manifest.patchedDependencies?.["storio@1.0.6"], "patches/storio@1.0.6.patch", "Storio's SSR/partial-update patch must stay registered");
if (errors.length) throw new Error(`Architecture audit failed:\n${errors.join("\n")}`);
process.stdout.write(JSON.stringify({ architecture: "passed", modules: modules.size, clientEntries: clients.length, initialClientModules: visited.size, serverModules: serverVisited.size, cssFiles: css.length }) + "\n");
