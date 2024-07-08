import { NavMenu } from "../../../components/nav-menu";

export function GroupMainMenu() {
  return (
    <NavMenu
      links={[
        "/test/group",
        ...Object.keys(demoData).map((e) => `/test/group/${e}`),
        "/test/group/checkout",
        "/test/group/blog",
      ]}
    />
  );
}

export const demoData: Record<string, string[]> = {
  electronics: ["phones", "tablets", "laptops"],
  clothing: ["tops", "shorts"],
};
