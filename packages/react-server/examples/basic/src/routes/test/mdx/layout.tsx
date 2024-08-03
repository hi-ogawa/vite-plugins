import type React from "react";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="text-lg">MDX</h3>
      <NavMenu links={["/test/mdx/simple", "/test/mdx/dynamic"]} />
      <div className="border-t"></div>
      {props.children}
    </div>
  );
}
