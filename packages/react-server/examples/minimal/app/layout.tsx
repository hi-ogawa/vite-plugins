import type React from "react";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <head>
        <script>console.log("ssr script!")</script>
      </head>
      <body>
        <div>[Layout]</div>
        {props.children}
      </body>
    </html>
  );
}
