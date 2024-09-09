import { handler } from "@hiogawa/react-server/entry/ssr";

Deno.serve((request) => handler(request));
