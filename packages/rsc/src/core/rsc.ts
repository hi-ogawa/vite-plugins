// @ts-ignore
import * as ReactServer from "@hiogawa/vite-rsc/vendor/react-server-dom/server.edge";

export function setRequireModule(options: {
  load: (id: string) => unknown;
}): void {
  serverManifest.load = options.load;
}

export const loadServerAction = (id: string): Promise<Function> => {
  return ReactServer.loadServerAction(id, serverManifest);
};

export const serverManifest: any = {};

export const clientManifest: any = {
  load: async (id: string) => {
    return new Proxy({} as any, {
      get(target, name, _receiver) {
        if (name === "then") return;
        return (target[name] ??= ReactServer.registerClientReference(
          () => {
            throw new Error("client reference shouldn't be called on server");
          },
          id,
          name,
        ));
      },
    });
  },
};

export const clientMetadataManifest: any = {};
