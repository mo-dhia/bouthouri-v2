import postcss from "postcss";
import values from "postcss-value-parser";

/** Paint hairlines/filter kernels are intentional CSS-pixel exceptions, not layout. */
export function viewportCssProblems(css: string): string[] {
  const problems: string[] = [];
  const source = postcss.parse(css);
  source.walkDecls((declaration) => {
    const { prop } = declaration;
    const nativeTail = declaration.parent?.type === "rule" && declaration.parent.selector === ".journey[data-enhanced]::after" &&
      prop === "height" && declaration.value.replace(/\s+/g, "") === "max(0vw,calc(100dvh-var(--design-height)))";
    const paintPixels = /^(?:border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-width)?|outline(?:-width)?|text-decoration-thickness|filter|backdrop-filter)$/.test(prop);
    values(declaration.value).walk((node) => {
      if (node.type === "function" && node.value.toLowerCase() === "url") return false;
      if (node.type === "function" && node.value.toLowerCase() === "clamp") problems.push(`${prop}: clamp must be resolved at the reference canvas`);
      if (node.type !== "word") return;
      const dimension = values.unit(node.value);
      if (!dimension) return;
      if (/^(?:s|l|d)?vh$|^v(?:min|max)$|^rem$/.test(dimension.unit) && !(nativeTail && dimension.unit === "dvh")) problems.push(`${prop}: design uses ${dimension.unit}`);
      if (dimension.unit === "px" && !paintPixels && !(prop === "border-radius" && dimension.number === "360")) problems.push(`${prop}: fixed px design length`);
    });
  });
  source.walkAtRules("media", (rule) => {
    // Geometry may select a category, never another layout within that category.
    if (/\b(?:height|aspect-ratio|orientation)\s*:|(?:min|max)-width\s*:/.test(rule.params)) problems.push(`media: use the three fixed width profiles: ${rule.params}`);
  });
  return problems;
}
