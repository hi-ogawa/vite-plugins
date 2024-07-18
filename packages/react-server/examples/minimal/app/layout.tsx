import type React from "react";
import { SsrOnly } from "./_client";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <head>
        {/* it only needs to render during ssr. also browser cannot hydrate head script properly.  */}
        <SsrOnly>
          <script>console.log("ssr script!")</script>
        </SsrOnly>
      </head>
      <body>
        <div>[Layout]</div>
        {props.children}
      </body>
    </html>
  );
}
