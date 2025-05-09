import { renderRequest } from "@hiogawa/vite-rsc/extra/rsc";
import { Root } from "./routes/root";
import { Styles } from "./styles";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const root = (
    <>
      <Styles />
      <Root url={url} />
    </>
  );
  return renderRequest(request, root);
}
