/** Original three-piece mark. Kept inline so entry and hover can move its pieces. */
export const logoPaths = [
  "M 0.16283161449966 36.76676079027144 A 36.62617153347209 36.76712414115423 0 1 1 0.16283161449966 -36.76676079027144 L 0.16283161449966 -22.502439339404283 A 22.379709467186295 22.503034981546598 0 1 0 0.16283161449966 22.502439339404283 Z",
  "M 36.800258 0 A 36.800258 36.789158 0 1 1 -36.800258 0 A 36.800258 36.789158 0 1 1 36.800258 0 Z M 21.409252 0 A 21.409252 21.357166 0 1 0 -21.409252 0 A 21.409252 21.357166 0 1 0 21.409252 0 Z",
  "M -26.099231 -7.585068758 H 26.099231 V 7.585068758 H -26.099231 Z",
] as const;
export const logoOrigins = [78.5, 133.5, 212.5] as const;

export default function IdentityLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 140"
      fill="currentColor"
      aria-hidden="true"
    >
      {logoPaths.map((d, index) => (
        <g
          key={d}
          data-hero-logo-piece={index + 1}
          transform={`translate(${logoOrigins[index]} 70) rotate(0)`}
        >
          <path d={d} fillRule="evenodd" />
        </g>
      ))}
    </svg>
  );
}
