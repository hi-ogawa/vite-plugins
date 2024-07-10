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
      <div className="jsx-123">CSS in JS</div>
      <JSXStyle id="123">{`
        div.jsx-123 {
          background: rgb(250, 220, 220);
          padding: 20px;
          width: 200px;
          border: 1px dashed gray;
        }
      `}</JSXStyle>
    </StyleRegistry>
  );
}
