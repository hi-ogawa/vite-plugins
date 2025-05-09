import "./styles.css";
import { renderRequest } from "@hiogawa/vite-rsc/extra/rsc";
import { Root } from "./routes/root";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const root = <Root url={url} />;
  return renderRequest(request, root);
}
