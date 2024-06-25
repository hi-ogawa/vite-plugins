export default function Page({ params }: any) {
  return <div id="dynamic-gsp-content">{"slug:" + params.slug}</div>;
}
