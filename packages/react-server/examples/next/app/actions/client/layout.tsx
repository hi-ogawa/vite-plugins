// TODO: this is a workaround for server action discovery
// see https://github.com/hi-ogawa/vite-plugins/pull/420
// import "./actions";

export default function Layout(props: any) {
  return <>{props.children}</>;
}
