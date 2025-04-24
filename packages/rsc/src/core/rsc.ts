// @ts-ignore
import * as ReactServer from "react-server-dom-vite/server.edge";

export function setRequireModule(options: {
  load: (id: string) => unknown;
}): void {
  ReactServer.setPreloadModule(options.load);
}

export const loadServerAction = ReactServer.loadServerAction as (
  id: string,
) => Promise<Function>;
