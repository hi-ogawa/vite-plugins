import type React from "react";
import "./styles.css";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <body>
        <div>[Layout]</div>
        {props.children}
      </body>
    </html>
  );
}
