import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import ts from "typescript";

/** Evaluate the actual controller without process-global module mocks or a GPU. */
export function loadIsolatedModule<T>(file: string, substitutes: Record<string, unknown>): T {
  const root = resolve(import.meta.dir, "../../../.."), cache = new Map<string, { exports: unknown }>();
  const external = createRequire(import.meta.url);
  function load(path: string): unknown {
    const found = cache.get(path);
    if (found) return found.exports;
    if (path.endsWith(".json")) return JSON.parse(readFileSync(path, "utf8"));
    const evaluatedModule = { exports: {} as unknown }; cache.set(path, evaluatedModule);
    const compiled = ts.transpileModule(readFileSync(path, "utf8"), { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const requireFromModule = (specifier: string) => {
      if (Object.hasOwn(substitutes, specifier)) return substitutes[specifier];
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return external(specifier);
      const base = specifier.startsWith("@/") ? resolve(root, "src", specifier.slice(2)) : resolve(dirname(path), specifier);
      const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`].find((candidate) => existsSync(candidate));
      if (!resolved) throw new Error(`Unresolved controller fixture dependency: ${specifier}`);
      return load(resolved);
    };
    new Function("require", "module", "exports", compiled)(requireFromModule, evaluatedModule, evaluatedModule.exports);
    return evaluatedModule.exports;
  }
  return load(resolve(root, file)) as T;
}

/** Globals are local to one bounded, non-concurrent test and always restored. */
export function installGlobals(values: Record<string, unknown>) {
  const originals = new Map(Object.keys(values).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  return () => { for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } };
}
