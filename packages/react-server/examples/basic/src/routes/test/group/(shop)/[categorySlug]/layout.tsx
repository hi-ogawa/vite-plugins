import { type LayoutProps, createError } from "@hiogawa/react-server/server";
import { NavMenu } from "../../../../../components/nav-menu";
import { demoData } from "../../_utils";

export default async function Layout(props: LayoutProps) {
  const category = props.params.categorySlug;
  const subCategories = demoData[category];
  if (!subCategories) {
    throw createError({ status: 404 });
  }

  return (
    <div className="flex flex-col gap-2 p-2 border">
      <h1>(shop)/[categorySlug]/layout.tsx</h1>
      <NavMenu
        links={subCategories.map((sub) => `/test/group/${category}/${sub}`)}
      />
      <div>{props.children}</div>
    </div>
  );
}
