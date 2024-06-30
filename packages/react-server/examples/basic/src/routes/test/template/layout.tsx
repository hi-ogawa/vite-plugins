import type React from "react";
import { NavMenu } from "../../../components/nav-menu";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="font-bold">Test Template</h3>
      <NavMenu
        className="grid grid-cols-1 gap-1"
        links={[
          "/test/template",
          "/test/template/x",
          "/test/template/x/a",
          "/test/template/x/b",
          "/test/template/y",
          "/test/template/y/a",
          "/test/template/y/b",
        ]}
      />
      {props.children}
    </div>
  );
}
