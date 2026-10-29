import postcss from "postcss";
import values from "postcss-value-parser";

/**
 * Lengths scale with width; stages fill the physical viewport height, so
 * viewport-height units and aspect/orientation queries stay live. Paint
 * hairlines/filter kernels are intentional CSS-pixel exceptions, not layout.
 */
export function viewportCssProblems(css: string): string[] {
  const problems: string[] = [];
  const source = postcss.parse(css);
  source.walkDecls((declaration) => {
    const { prop } = declaration;
    const paintPixels = /^(?:border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-width)?|outline(?:-width)?|text-decoration-thickness|filter|backdrop-filter)$/.test(prop);
    values(declaration.value).walk((node) => {
      if (node.type === "function" && node.value.toLowerCase() === "url") return false;
      if (node.type === "function" && node.value.toLowerCase() === "clamp") problems.push(`${prop}: clamp must be resolved at the reference canvas`);
      if (node.type !== "word") return;
      const dimension = values.unit(node.value);
      if (!dimension) return;
      if (/^v(?:min|max)$|^rem$/.test(dimension.unit)) problems.push(`${prop}: design uses ${dimension.unit}`);
      if (dimension.unit === "px" && !paintPixels && !(prop === "border-radius" && dimension.number === "360")) problems.push(`${prop}: fixed px design length`);
    });
  });
  source.walkAtRules("media", (rule) => {
    // Width selects one of three profiles; height enters only as proportions.
    if (/\b(?:min-|max-)?height\s*:|(?:min|max)-width\s*:/.test(rule.params)) problems.push(`media: use the three width profiles and aspect-ratio for height: ${rule.params}`);
  });
  return problems;
}
