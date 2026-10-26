import Image, { type ImageProps } from "next/image";
import type { CSSProperties } from "react";
import styles from "./responsive-image.module.css";

type Props = Omit<ImageProps, "fill" | "width" | "height" | "sizes" | "className" | "style" | "alt"> & {
  alt: string;
  sizes: string;
  aspectRatio: CSSProperties["aspectRatio"];
  className?: string;
  imageClassName?: string;
};

/** Server-compatible media reservation. Preload only the actual LCP image. */
export default function ResponsiveImage({ alt, aspectRatio, className, imageClassName, ...props }: Props) {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(" ")} style={{ aspectRatio }}>
      <Image {...props} alt={alt} fill className={[styles.image, imageClassName].filter(Boolean).join(" ")} />
    </div>
  );
}
