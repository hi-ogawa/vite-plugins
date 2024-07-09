import type { LayoutProps, Metadata } from "@hiogawa/react-server/server";
import { Header } from "../components/header";
import { NavMenu } from "../components/nav-menu";

export const metadata: Metadata = {
  title: "rsc-experiment",
};

export default function Layout(props: LayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="p-4 flex flex-col gap-2  max-w-lg">
          <Header />
          <NavMenu
            className="grid grid-cols-3 gap-1"
            links={["/", "/test", "/demo/waku_02"]}
          />
          {props.children}
        </div>
      </body>
    </html>
  );
}
