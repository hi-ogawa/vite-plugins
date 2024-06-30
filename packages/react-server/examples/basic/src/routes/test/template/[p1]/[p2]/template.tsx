import { MountCount } from "../../_client";

export default function Template(props: React.PropsWithChildren) {
  return (
    <div className="border p-2">
      <MountCount name="[p1]/[p2]/template.tsx" />
      {props.children}
    </div>
  );
}
