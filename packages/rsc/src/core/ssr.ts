// @ts-ignore
import * as ReactClient from "react-server-dom-vite/client.edge";

export function setRequireModule(options: {
  load: (id: string) => unknown;
}): void {
  ReactClient.setPreloadModule((id: string) => {
    return options.load(id);
  });
}
