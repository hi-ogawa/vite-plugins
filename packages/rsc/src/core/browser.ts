// @ts-ignore
import * as ReactClient from "react-server-dom-vite/client.browser";

export function setRequireModule(options: {
  load: (id: string) => Promise<unknown>;
}): void {
  ReactClient.setPreloadModule(options.load);
}
