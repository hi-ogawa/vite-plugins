import type React from "react";
import { NavMenu } from "../../../../components/nav-menu";
import { getPosts } from "./_utils";

export default function Layout(props: React.PropsWithChildren) {
  const posts = getPosts();
  const links = Object.keys(posts).map((slug) => `/test/mdx/dynamic/${slug}`);
  return (
    <div className="flex flex-col gap-2">
      <NavMenu links={links} />
      {props.children}
    </div>
  );
}
