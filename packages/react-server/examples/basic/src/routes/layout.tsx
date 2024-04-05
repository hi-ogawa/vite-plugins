import type { LayoutProps } from "@hiogawa/react-server/server";
import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

export default function Layout(props: LayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>rsc-experiment</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="p-4 flex flex-col gap-2">
          <Header />
          <NavMenu
            className="flex flex-col items-start gap-1"
            links={["/", "/test", "/demo/waku_02", "/demo/remix-tutorial"]}
          />
          {props.children}
        </div>
      </body>
    </html>
  );
}
