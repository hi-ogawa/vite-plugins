"use client";

/** @todo */
export default function Image({
  priority,
  ...props
}: JSX.IntrinsicElements["img"] & { priority?: unknown }) {
  return <img {...props} />;
}
