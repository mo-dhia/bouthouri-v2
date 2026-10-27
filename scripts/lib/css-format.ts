import assert from "node:assert/strict";
import postcss, { type AnyNode } from "postcss";

/** Change token whitespace only. Quoted payloads (including SVG data URLs) stay intact. */
function tokens(value: string): string {
  let result = "";
  for (let i = 0; i < value.length; i++) {
    const character = value[i];
    if (/^url\(/i.test(value.slice(i)) && !/[\w-]/.test(value[i - 1] ?? "")) {
      // A comma in an unquoted data URL is payload, not a CSS list separator.
      let depth = 0, quote = "", end = i;
      for (; end < value.length; end++) {
        const next = value[end];
        if (next === "\\") { end++; continue; }
        if (quote) { if (next === quote) quote = ""; continue; }
        if (next === "'" || next === '"') quote = next;
        else if (next === "(") depth++;
        else if (next === ")" && --depth === 0) break;
      }
      result += value.slice(i, end + 1); i = end; continue;
    }
    if (character === "\\") {
      result += value.slice(i, i + 2); i++; continue;
    }
    if (character === "'" || character === '"') {
      let content = "";
      const quote = character;
      for (i++; i < value.length; i++) {
        if (value[i] === "\\") { content += value.slice(i, i + 2); i++; }
        else if (value[i] === quote) break;
        else content += value[i];
      }
      // Keep double-quoted payloads containing apostrophes instead of rewriting
      // their escapes. In particular, do not alter embedded SVG/XML data.
      const outputQuote = quote === '"' && !content.includes("'") ? "'" : quote;
      result += outputQuote + content + outputQuote;
    } else if (character === ",") {
      result = result.trimEnd() + ", ";
      while (/\s/.test(value[i + 1] ?? "") && i + 1 < value.length) i++;
    } else result += character;
  }
  return result.trim();
}

function selector(value: string): string {
  return [...new Set(postcss.list.comma(value).map(tokens))].join(", ");
}

function semantic(node: AnyNode): unknown {
  if (node.type === "decl") return ["decl", node.prop, tokens(node.value), !!node.important];
  if (node.type === "comment") return ["comment", node.text];
  if (node.type === "rule") return ["rule", selector(node.selector), node.nodes.map(semantic)];
  if (node.type === "atrule") return ["at", node.name, tokens(node.params), node.nodes?.map(semantic)];
  return [node.type, "nodes" in node ? node.nodes.map(semantic) : []];
}

function print(node: AnyNode, depth = 0): string {
  const indent = "  ".repeat(depth);
  if (node.type === "comment") return `${indent}/* ${node.text} */`;
  if (node.type === "decl") return `${node.prop}: ${tokens(node.value)}${node.important ? " !important" : ""}`;
  const label = node.type === "rule" ? selector(node.selector)
    : node.type === "atrule" ? `@${node.name}${node.params ? ` ${tokens(node.params)}` : ""}` : "";
  if (node.type === "atrule" && !node.nodes) return `${indent}${label};`;
  const children = node.nodes ?? [];
  if (children.every((child) => child.type === "decl" || child.type === "comment")) {
    const body = children.map((child, index) => print(child) + (child.type === "decl" && index < children.length - 1 ? ";" : "")).join(" ");
    return `${indent}${label} { ${body} }`;
  }
  return `${indent}${label} {\n${children.map((child) => print(child, depth + 1)).join("\n")}\n${indent}}`;
}

/** Preserve declaration order, cascade, units, breakpoints, functions and payloads. */
export function formatStylesheet(css: string, file: string): string {
  const original = postcss.parse(css, { from: file });
  const formatted = original.nodes.map((node) => print(node)).join("\n") + "\n";
  assert.deepEqual(semantic(postcss.parse(formatted, { from: file })), semantic(original), `CSS semantics changed: ${file}`);
  return formatted;
}
