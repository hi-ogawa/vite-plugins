import { ClientTime } from "../../_client";

export default function Template(props: React.PropsWithChildren) {
  return (
    <div className="border p-2">
      <div>
        [p1]/[p2]/template.tsx <ClientTime />
      </div>
      {props.children}
    </div>
  );
}
