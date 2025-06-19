import { createError, type PageProps } from "@hiogawa/react-server/server";

declare module "@hiogawa/react-server/server" {
  interface ReactServerErrorContext {
    customMessage?: string;
  }
}

export default function Page(props: PageProps) {
  const url = new URL(props.request.url);
  if (url.searchParams.has("custom")) {
    throw createError({ status: 403, customMessage: "hello" });
  }
  throw new Error("boom!");
}
