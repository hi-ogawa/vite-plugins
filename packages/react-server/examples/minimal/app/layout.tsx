import type React from "react";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `/* boom! */` }}></script>
      </head>
      <body>
        <div>[Layout]</div>
        {props.children}
      </body>
    </html>
  );
}
