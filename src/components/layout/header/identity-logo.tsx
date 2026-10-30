import {
  markPaths,
  markPieces,
  markTransform,
  wordmarkMarkOffset,
  wordmarkPaths,
  wordmarkRest,
  wordmarkViewBox,
} from "./identity-mark";

/**
 * Kit wordmark from the brand book. Its b is the live mark: three pieces the
 * header loop and the entry move, resting on b when nothing drives them.
 */
export default function IdentityLogo({ className }: { className?: string }) {
  const rest = wordmarkRest();
  return (
    <svg
      className={className}
      viewBox={wordmarkViewBox}
      fill="currentColor"
      aria-hidden="true"
      data-logo-wordmark="true"
    >
      <g data-logo-letters="true">
        {wordmarkPaths.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
      <g data-logo-mark="true" transform={`translate(${wordmarkMarkOffset} 0)`}>
        {markPaths.map((d, index) => (
          <path
            key={index}
            d={d}
            data-logo-piece={markPieces[index]}
            transform={markTransform(rest[markPieces[index]])}
          />
        ))}
      </g>
    </svg>
  );
}
