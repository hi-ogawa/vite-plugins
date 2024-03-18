import type { LayoutRouteProps } from "@hiogawa/react-server/server";
import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

export default function Layout(props: LayoutRouteProps) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>rsc-experiment</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <LayoutInner {...props} />
      </body>
    </html>
  );
}

async function LayoutInner(props: LayoutRouteProps) {
  return (
    <div className="p-4 flex flex-col gap-2">
      <Header />
      <NavMenu links={["/", "/test", "/demo/waku_02"]} />
      {props.children}
    </div>
  );
}
