"use client";

/** @todo */
export default function Image({
  priority,
  placeholder,
  blurDataURL,
  ...props
}: JSX.IntrinsicElements["img"] & {
  priority?: unknown;
  placeholder?: unknown;
  blurDataURL?: unknown;
}) {
  return <img {...props} />;
}
