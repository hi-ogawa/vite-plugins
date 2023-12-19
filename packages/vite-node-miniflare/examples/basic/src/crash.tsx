import { crash } from "./crash-dep";

export function CrashSsr(props: { url: string }) {
  if (import.meta.env.SSR && props.url.includes("crash-ssr")) {
    crash("crash ssr");
  }
  return <div>Hello</div>;
}
