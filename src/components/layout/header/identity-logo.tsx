import { markPaths, markRow, markTransform } from "./identity-mark";

/** Three-piece mark, kept inline so entry and hover can move its pieces. */
export default function IdentityLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 140"
      fill="currentColor"
      aria-hidden="true"
    >
      {markPaths.map((d, index) => (
        <g
          key={index}
          data-hero-logo-piece={index + 1}
          transform={markTransform(markRow[index])}
        >
          <path d={d} fillRule="evenodd" />
        </g>
      ))}
    </svg>
  );
}
