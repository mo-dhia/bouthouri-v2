import { readFileSync, writeFileSync } from "node:fs";
import { formatStylesheet } from "./lib/css-format";

const write = process.argv.includes("--write");
const files = [...new Bun.Glob("src/**/*.css").scanSync()].sort();
const changed: string[] = [];
for (const file of files) {
  const css = readFileSync(file, "utf8"), formatted = formatStylesheet(css, file);
  if (formatted === css) continue;
  changed.push(file);
  if (write) writeFileSync(file, formatted);
}
process.stdout.write(JSON.stringify({ cssFiles: files.length, mode: write ? "write" : "check", changed }) + "\n");
if (!write && changed.length) process.exitCode = 1;
