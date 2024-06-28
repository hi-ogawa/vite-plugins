export default function Template(props: React.PropsWithChildren) {
  return (
    <div className="border p-2">
      <div>/template/[p1]/[p2]/template.tsx</div>
      {props.children}
    </div>
  );
}
