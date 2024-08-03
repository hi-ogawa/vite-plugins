import type React from "react";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="text-lg">MDX</h3>
      {props.children}
    </div>
  );
}
