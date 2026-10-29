import postcss, { type ChildNode, type Container } from "postcss";
import values, { type Node } from "postcss-value-parser";
import { viewportDesigns, type ViewportDesign } from "../../src/lib/viewport-design";
import { formatStylesheet } from "./css-format";

const number = (value: number) => Number(value.toFixed(12)).toString();
type Quantity = { value: number; unit: string };
const quantity = (node: Node): Quantity | null => {
  if (node.type !== "word") return null;
  const match = /^(-?(?:\d*\.)?\d+(?:e[+-]?\d+)?)([a-z%]*)$/i.exec(node.value);
  return match ? { value: Number(match[1]), unit: match[2] } : null;
};
const compatible = (a: Quantity, b: Quantity) => a.unit === b.unit || a.value === 0 || b.value === 0;

/** Evaluate only dimensionally valid, fully known CSS arithmetic. Variables stay live. */
function arithmetic(nodes: Node[]): Quantity | null {
  const tokens = nodes.filter((node) => node.type !== "space" && node.type !== "comment");
  let index = 0;
  const atom = (): Quantity | null => {
    const node = tokens[index++];
    return node ? quantity(node) : null;
  };
  const product = (): Quantity | null => {
    let result = atom();
    while (result && ["*", "/"].includes(tokens[index]?.value)) {
      const op = tokens[index++].value, next = atom();
      if (!next || (op === "*" && result.unit && next.unit) || (op === "/" && (next.unit || !next.value))) return null;
      result = { value: op === "*" ? result.value * next.value : result.value / next.value, unit: result.unit || next.unit };
    }
    return result;
  };
  let result = product();
  while (result && ["+", "-"].includes(tokens[index]?.value)) {
    const op = tokens[index++].value, next = product();
    if (!next || !compatible(result, next)) return null;
    result = { value: op === "+" ? result.value + next.value : result.value - next.value, unit: result.unit || next.unit };
  }
  return index === tokens.length ? result : null;
}

/** Scale reference lengths by width; leave viewport heights, percentages, font-relative metrics and payloads intact. */
export function fixedViewportValue(value: string, design: ViewportDesign, prop = ""): string {
  const parsed = values(value);
  const visit = (nodes: Node[]) => {
    for (const node of nodes) {
      if (node.type === "word") {
        const q = quantity(node);
        if (!q) continue;
        if (q.unit === "px" && /^stroke-(?:width|dasharray|dashoffset)$/.test(prop)) {
          // SVG viewBox/pathLength already supplies the design scale. CSS vw
          // here would apply a second viewport scale inside that local camera.
          node.value = number(q.value);
          continue;
        }
        // Viewport-height units stay live: the stage is the physical window,
        // composed as the reference width at the window's proportions.
        const px = q.unit === "px" ? q.value : q.unit === "rem" ? q.value * 16 : null;
        if (px !== null) {
          // Device hairlines and filter sampling are the guide's explicit exceptions.
          const hairline = /^(?:border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-width)?|outline(?:-width)?|text-decoration-thickness)$/.test(prop);
          if (q.unit === "px" && (hairline || prop === "filter" || prop === "backdrop-filter")) continue;
          node.value = `${number(px / design.width * 100)}vw`;
        }
      } else if (node.type === "function" && !["url", "var", "env"].includes(node.value.toLowerCase())) {
        visit(node.nodes);
        const name = node.value.toLowerCase();
        let evaluated: Quantity | null = null;
        if (name === "calc") evaluated = arithmetic(node.nodes);
        if (["min", "max", "clamp"].includes(name)) {
          const groups: Node[][] = [[]];
          for (const child of node.nodes) {
            if (child.type === "div" && child.value === ",") groups.push([]);
            else groups.at(-1)!.push(child);
          }
          const args = groups.map(arithmetic);
          if (args.every((q): q is Quantity => !!q) && args.every((q) => compatible(args[0]!, q))) {
            const scalars = args.map((q) => q!.value);
            evaluated = { value: name === "min" ? Math.min(...scalars) : name === "max" ? Math.max(...scalars) : Math.max(scalars[0], Math.min(scalars[1], scalars[2])), unit: args.find((q) => q!.unit)?.unit ?? "" };
            if (prop === "font-size" && evaluated.unit === "vw") {
              // Firefox resolves a bounded font length to app units before
              // its outer type-scale multiplication. Preserve that reference
              // boundary when removing the now-constant clamp/min/max.
              const px = evaluated.value * design.width / 100;
              evaluated.value = Math.floor((px + 1e-9) * 60) / 60 / design.width * 100;
            }
          } else if (name === "clamp") {
            // Runtime title-line/font-scale variables remain responsive to content,
            // while every design bound scales uniformly within the fixed profile.
            const [min, preferred, max] = groups.map((group) => values.stringify(group).trim());
            node.value = "max";
            node.nodes = values(`${min}, min(${preferred}, ${max})`).nodes;
          }
        }
        if (evaluated) {
          Object.assign(node, { type: "word", value: `${number(evaluated.value)}${evaluated.unit}` });
        }
      } else if (node.type === "function" && node.value.toLowerCase() === "var") {
        // Convert fallback lengths without interpreting the custom property itself.
        const comma = node.nodes.findIndex((child) => child.type === "div" && child.value === ",");
        if (comma >= 0) visit(node.nodes.slice(comma + 1));
      }
    }
  };
  visit(parsed.nodes);
  return values.stringify(parsed.nodes);
}

/**
 * Resolve width at the reference canvas. The reference stage keeps the
 * window's proportions, so its height is physical height × reference width /
 * width: height thresholds become aspect-ratio thresholds, while orientation
 * and aspect-ratio queries stay live.
 */
export function fixedViewportMedia(query: string, design: ViewportDesign): string | false {
  const branches = postcss.list.comma(query).map((branch) => {
    let rejected = false;
    const remaining = branch.replace(/\(([-\w]+)\s*:\s*([^()]+)\)/g, (raw, feature: string, expected: string) => {
      const base = feature.replace(/^(min|max)-/, "");
      if (base === "orientation" || base === "aspect-ratio") return raw;
      if (base !== "width" && base !== "height") return raw;
      if (!/^\s*[\d.]+px\s*$/.test(expected)) throw new Error(`Unsupported design query: ${raw}`);
      const target = Number.parseFloat(expected);
      if (base === "height") {
        const ratio = `${design.width}/${number(target)}`;
        return feature === "max-height" ? `(min-aspect-ratio:${ratio})` : feature === "min-height" ? `(max-aspect-ratio:${ratio})` : `(aspect-ratio:${ratio})`;
      }
      const actual = design.width;
      const matches = feature.startsWith("min-") ? actual >= target : feature.startsWith("max-") ? actual <= target : actual === target;
      if (!matches) rejected = true;
      return "";
    }).replace(/\b(?:only|screen|all)\b/g, "").replace(/^\s*and\s*|\s*and\s*$/g, "").replace(/\band\s+and\b/g, "and").trim();
    // Multiple removed geometry clauses can leave a second leading conjunction.
    const normalized = remaining.replace(/^(?:and\s*)+|(?:\s*and)+$/g, "").trim();
    return rejected ? false : normalized;
  });
  if (branches.includes("")) return "";
  const retained = branches.filter((branch): branch is string => branch !== false);
  return retained.length ? retained.join(", ") : false;
}

function profileNodes(source: Container, design: ViewportDesign): ChildNode[] {
  const result: ChildNode[] = [];
  for (const original of source.nodes ?? []) {
    const node = original.clone();
    if (node.type === "atrule" && node.name === "media") {
      const condition = fixedViewportMedia(node.params, design);
      if (condition === false) continue;
      const children = profileNodes(node, design);
      if (!condition) result.push(...children);
      else { node.params = condition; node.removeAll().append(children); result.push(node); }
    } else {
      if (node.type === "decl") node.value = fixedViewportValue(node.value, design, node.prop);
      else if ("nodes" in node && node.nodes) node.removeAll().append(profileNodes(original as Container, design));
      result.push(node);
    }
  }
  return result;
}

/** One-time migration helper. Exclusive ranges prevent desktop-only declarations leaking. */
export function fixedViewportStylesheet(css: string, file: string): string {
  const source = postcss.parse(css, { from: file }), output = postcss.root();
  output.append(postcss.comment({ text: "Design profiles: desktop 1920, tablet 768, mobile 412 wide. Lengths scale with width; stages fill the physical viewport height." }));
  for (const design of Object.values(viewportDesigns)) {
    const params = design.key === "desktop" ? "(width > 1024px)" : design.key === "tablet" ? "(600px < width <= 1024px)" : "(width <= 600px)";
    const profile = postcss.atRule({ name: "media", params }).append(profileNodes(source, design));
    if (file === "src/app/globals.css") {
      profile.append(postcss.rule({ selector: "body" }).append({ prop: "font-size", value: `${number(16 / design.width * 100)}vw` }));
    }
    if (file.endsWith("journey.module.css")) {
      profile.append(postcss.rule({ selector: ".journey :global(.systems-still path), .journey :global(.work-quiet-symbol path)" })
        .append({ prop: "stroke-width", value: fixedViewportValue("1.25px", design) }));
    }
    profile.walkDecls((decl) => {
      const parsed = values(decl.value);
      parsed.walk((node) => {
        if (node.type === "function" && node.value === "url") return false;
        const q = quantity(node);
        if (!q || q.unit !== "vw" || !q.value) return;
        // The production CSS serializer keeps six significant figures. Round
        // upwards deliberately so exact pixel boundaries (e.g.915px mobile
        // height) do not become914.983px after a truncated vw coefficient.
        const power = 10 ** (5 - Math.floor(Math.log10(Math.abs(q.value))));
        const safe = Math.ceil(Math.abs(q.value) * power - 1e-7) / power * Math.sign(q.value);
        node.value = `${number(safe)}vw`;
      });
      decl.value = values.stringify(parsed.nodes);
    });
    output.append(profile);
  }
  return formatStylesheet(output.toString(), file);
}
