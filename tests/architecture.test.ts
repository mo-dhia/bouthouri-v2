import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const audit = fileURLToPath(new URL("../scripts/audit-architecture.ts", import.meta.url));

/** Isolated source fixtures: never mutate the checkout while other tests run. */
function inspect(files: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), "gazzar-architecture-"));
  try {
    writeFileSync(join(directory, "package.json"), JSON.stringify({
      dependencies: {}, patchedDependencies: { "storio@1.0.6": "patches/storio@1.0.6.patch" },
    }));
    for (const [file, content] of Object.entries(files)) {
      const path = join(directory, file);
      mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content);
    }
    return spawnSync(process.execPath, [audit], { cwd: directory, encoding: "utf8", timeout: 15000 });
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

test("initial client graph rejects transitive graphics, content and static controller imports", () => {
  for (const [dependency, content, message] of [
    ["src/bridge.ts", 'import { Scene } from "three";', "initial client graph reaches three"],
    ["src/i18n/locales/en.json", '{"heading":"Server copy"}', "client graph imports server content"],
    ["src/reveal.animate.ts", "export const mount = () => () => {};", "statically imports deferred controller"],
  ]) {
    const result = inspect({ "src/gate.ts": `"use client"; import "./${dependency.slice(4)}";`, [dependency]: content });
    expect(result.status).toBe(1); expect(result.stderr).toContain(message);
  }
});

test("type-only edges and a dynamic graphics boundary stay out of the initial graph", () => {
  const result = inspect({
    "src/gate.ts": '"use client"; import type { Camera } from "./types.js"; export const load = () => import("./scene.animate");',
    "src/types.ts": 'import type { PerspectiveCamera } from "three"; export type Camera = PerspectiveCamera;',
    "src/scene.animate.ts": 'import { Scene } from "three"; export const scene = new Scene();',
  });
  expect(result.status).toBe(0); expect(result.stdout).toContain('"architecture":"passed"');
});

test("server routes cannot import browser graphics or become client composition", () => {
  for (const source of ['import { Scene } from "three";', '"use client";']) {
    const result = inspect({ "src/app/layout.tsx": source });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/server content graph|route composition/);
  }
});

test("architecture audit rejects forbidden runtimes, non-hook store subscriptions and malformed style format", () => {
  for (const [file, source, message] of [
    ["src/controller.ts", 'export const load = () => import("gsap");', "prohibited runtime gsap"],
    ["src/controller.ts", 'const selected = uiStore(state => state.menuOpen);', "use-prefixed Storio alias"],
    ["src/layout.css", ".a{width:10px}", "one-line selector formatting"],
  ]) {
    const result = inspect({ [file]: source });
    expect(result.status).toBe(1); expect(result.stderr).toContain(message);
  }
});

test("viewport design audit rejects fixed layout lengths and height-based composition", () => {
  for (const [source, reason] of [
    [".a { width: 20px }\n", "fixed px design length"],
    [".a { height: 100svh }\n", "design uses svh"],
    [".a { font-size: 1rem }\n", "design uses rem"],
    [".a { font-size: clamp(1vw, 2vw, 3vw) }\n", "clamp must be resolved"],
    ["@media (max-height: 600px) {\n  .a { display: none }\n}\n", "three fixed width profiles"],
  ]) {
    const result = inspect({ "src/layout.css": source });
    expect(result.status).toBe(1); expect(result.stderr).toContain(reason);
  }
  const result = inspect({ "src/layout.css": ".a { width: 5vw; height: 10vw; border: 1px solid #fff; filter: blur(2px); letter-spacing: .1em }\n" });
  expect(result.status).toBe(0);
  expect(inspect({ "src/layout.css": ".journey[data-enhanced]::after { height: max(0vw, calc(100dvh - var(--design-height))) }\n" }).status).toBe(0);
  expect(inspect({ "src/layout.css": ".journey[data-enhanced]::after { height: 100dvh }\n" }).status).toBe(1);
});
