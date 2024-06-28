export default function Template(props: React.PropsWithChildren) {
  return (
    <div className="border p-2">
      <div>/template/[p1]/template.tsx</div>
      {props.children}
    </div>
  );
}
