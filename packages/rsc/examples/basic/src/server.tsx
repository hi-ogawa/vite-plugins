import { renderRequest } from "@hiogawa/vite-rsc/extra/rsc";
import { Root } from "./routes/root";

export default async function handler(request: Request): Promise<Response> {
  const root = <Root />;
  return renderRequest(request, root);
}
