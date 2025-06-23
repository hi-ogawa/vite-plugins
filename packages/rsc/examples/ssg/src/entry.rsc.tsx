import { renderRequest } from "@hiogawa/vite-rsc/extra/rsc";
import { Root } from "./root";

export default async function handler(request: Request): Promise<Response> {
  // TODO: error handling
  return renderRequest(request, <Root request={request} />);
}
