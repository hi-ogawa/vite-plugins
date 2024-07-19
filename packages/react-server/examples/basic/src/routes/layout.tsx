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
        <script>self.__testHeadInlineScript = true</script>
      </head>
      <body>
        <div className="p-4 flex flex-col gap-2">
          <Header />
          <NavMenu
            className="flex flex-col items-start gap-1"
            links={["/", "/test", "/demo/waku_02"]}
          />
          {props.children}
        </div>
      </body>
    </html>
  );
}
