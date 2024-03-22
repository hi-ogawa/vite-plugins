import { type PageRouteProps, createError } from "@hiogawa/react-server/server";

declare module "@hiogawa/react-server/server" {
  interface ReactServerErrorContext {
    customMessage?: string;
  }
}

export default function Page(props: PageRouteProps) {
  const url = new URL(props.request.url);
  if (url.searchParams.has("custom")) {
    throw createError({ status: 403, customMessage: "hello" });
  }
  throw new Error("boom!");
}
