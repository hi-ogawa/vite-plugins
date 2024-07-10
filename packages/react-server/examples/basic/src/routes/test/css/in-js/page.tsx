"use client";

import { useServerInsertedHTML } from "@hiogawa/react-server/client";
import React from "react";
import { StyleRegistry, createStyleRegistry } from "styled-jsx";
import JSXStyle from "styled-jsx/style";

// https://github.com/vercel/styled-jsx#server-side-rendering
// https://github.com/vercel/styled-jsx#how-it-works

export default function Page() {
  const [registry] = React.useState(() => createStyleRegistry());
  useServerInsertedHTML(() => <>{registry.styles()}</>);

  return (
    <StyleRegistry registry={registry}>
      <button className="jsx-123">CSS in JS</button>
      <JSXStyle id="123">{`
        button.jsx-123 {
          color: red;
        }
      `}</JSXStyle>
    </StyleRegistry>
  );
}
