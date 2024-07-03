"use client";

import ReactDOM from "react-dom";

/** @todo */
export default function Image({
  priority,
  placeholder,
  blurDataURL,
  ...props
}: JSX.IntrinsicElements["img"] & {
  priority?: boolean;
  placeholder?: unknown;
  blurDataURL?: unknown;
}) {
  // support only preload for now
  // https://github.com/vercel/next.js/blob/82639520d3b70d6b532ce5ec650c0c5b268706a4/packages/next/src/client/image-component.tsx#L329-L337
  if (props.src && priority) {
    ReactDOM.preload(props.src, {
      as: "image",
      fetchPriority: "high",
      imageSrcSet: props.srcSet,
      imageSizes: props.sizes,
      crossOrigin: props.crossOrigin,
      referrerPolicy: props.referrerPolicy,
    });
  }

  return <img {...props} />;
}
