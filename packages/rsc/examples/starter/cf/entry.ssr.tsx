// @ts-ignore
import { WorkerEntrypoint } from "cloudflare:workers";
import { renderHTML } from "../src/framework/entry.ssr";

export default class DevRenderHTML extends WorkerEntrypoint {
  renderHTML(arg: any) {
    return renderHTML(arg);
  }
}
