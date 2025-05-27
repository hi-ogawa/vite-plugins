import { webToNodeHandler } from "@hiogawa/utils-node";
import { readFileSync } from "fs";
import {
  Miniflare,
  Response as MiniflareResponse,
  mergeWorkerOptions,
  type SharedOptions,
  type WorkerOptions,
} from "miniflare";
import {
  DevEnvironment,
  type HotChannel,
  type HotPayload,
  type Plugin,
  type ResolvedConfig,
} from "vite";
import type { SourcelessWorkerOptions } from "wrangler";
import { type FetchMetadata, type RunnerRpc } from "./shared";

interface WorkerdPluginOptions extends WorkerdEnvironmentOptions {
  entry: string;
}

interface WorkerdEnvironmentOptions {
  miniflare?: SharedOptions & SourcelessWorkerOptions;
  wrangler?: {
    configPath?: string;
  };
  hmr?: boolean;
}

export function vitePluginWorkerd(pluginOptions: WorkerdPluginOptions): Plugin {
  return {
    name: vitePluginWorkerd.name,
    async config(_config, _env) {
      return {
        environments: {
          workerd: {
            dev: {
              createEnvironment: (name, config) =>
                createWorkerdDevEnvironment(name, config, pluginOptions),
            },
            build: pluginOptions.entry
              ? {
                  ssr: true,
                  rollupOptions: {
                    input: {
                      index: pluginOptions.entry,
                    },
                  },
                }
              : undefined,
          },
        },
      };
    },

    configureServer(server) {
      const entry = pluginOptions.entry;
      if (!entry) {
        return;
      }
      const devEnv = server.environments["workerd"] as WorkerdDevEnvironment;
      const nodeMiddleware = webToNodeHandler((request) =>
        devEnv.api.dispatchFetch(entry, request),
      );
      return () => {
        server.middlewares.use(nodeMiddleware);
      };
    },
  };
}

export type WorkerdDevEnvironment = DevEnvironment & {
  api: WorkerdDevApi;
};

type WorkerdDevApi = {
  dispatchFetch: (entry: string, request: Request) => Promise<Response>;
};

export async function createWorkerdDevEnvironment(
  name: string,
  config: ResolvedConfig,
  pluginOptions: WorkerdEnvironmentOptions,
) {
  // setup miniflare with a durable object script to run vite module runner
  let runnerWorkerOptions: WorkerOptions = {
    modulesRoot: "/",
    modules: [
      {
        type: "ESModule",
        path: "__vite_worker__",
        contents: readFileSync(
          new URL("./worker.js", import.meta.url),
          "utf-8",
        ),
      },
      {
        type: "ESModule",
        path: "vite/module-runner",
        contents: readFileSync(
          new URL(import.meta.resolve("vite/module-runner")),
          "utf-8",
        ),
      },
    ],
    durableObjects: {
      __viteRunner: "RunnerObject",
    },
    unsafeEvalBinding: "__viteUnsafeEval",
    serviceBindings: {
      __viteInvoke: async (request) => {
        const payload = (await request.json()) as HotPayload;
        const result = await devEnv.hot.handleInvoke(payload);
        return MiniflareResponse.json(result);
      },
      __viteRunnerSend: async (request) => {
        const payload = (await request.json()) as HotPayload;
        hotListener.dispatch(payload, { send: runnerObject.__viteServerSend });
        return MiniflareResponse.json(null);
      },
    },
    bindings: {
      __viteRoot: config.root,
    },
  };

  // https://github.com/cloudflare/workers-sdk/blob/2789f26a87c769fc6177b0bdc79a839a15f4ced1/packages/vitest-pool-workers/src/pool/config.ts#L174-L195
  if (pluginOptions.wrangler?.configPath) {
    const wrangler = await import("wrangler");
    const wranglerOptions = wrangler.unstable_getMiniflareWorkerOptions(
      pluginOptions.wrangler.configPath,
    );
    // TODO: could this be useful to not delete?
    delete wranglerOptions.workerOptions.sitePath;
    runnerWorkerOptions = mergeWorkerOptions(
      wranglerOptions.workerOptions,
      runnerWorkerOptions,
    ) as WorkerOptions;
  }

  if (pluginOptions.miniflare) {
    runnerWorkerOptions = mergeWorkerOptions(
      pluginOptions.miniflare,
      runnerWorkerOptions,
    ) as WorkerOptions;
  }

  const miniflare = new Miniflare({
    ...pluginOptions.miniflare,
    workers: [runnerWorkerOptions],
  });

  // get durable object singleton
  const ns = await miniflare.getDurableObjectNamespace("__viteRunner");
  const runnerObject = ns.get(ns.idFromName("")) as any as Fetcher & RunnerRpc;

  // init via rpc
  await runnerObject.__viteInit();

  // hmr channel
  const hotListener = createHotListenerManager();
  const transport: HotChannel = {
    listen: () => {},
    close: () => {},
    on: hotListener.on,
    off: hotListener.off,
    send: runnerObject.__viteServerSend,
  };

  // TODO: move initialization code to `init`?
  // inheritance to extend dispose
  class WorkerdDevEnvironmentImpl extends DevEnvironment {
    override async close() {
      await super.close();
      await miniflare.dispose();
    }
  }

  const devEnv = new WorkerdDevEnvironmentImpl(name, config, {
    transport,
    hot: true,
  });

  // custom environment api
  const api: WorkerdDevApi = {
    // fetch proxy
    async dispatchFetch(entry: string, request: Request) {
      const headers = new Headers(request.headers);
      headers.set(
        "x-vite-fetch",
        JSON.stringify({ entry } satisfies FetchMetadata),
      );
      const fetch_ = runnerObject.fetch as any as typeof fetch; // fix web/undici types
      const res = await fetch_(request.url, {
        method: request.method,
        headers,
        body: request.body as any,
        redirect: "manual",
        // @ts-ignore undici
        duplex: "half",
      });
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    },
  };

  return Object.assign(devEnv, { api }) as WorkerdDevEnvironment;
}

// wrapper to simplify listener management
function createHotListenerManager(): Pick<HotChannel, "on" | "off"> & {
  dispatch: (
    payload: HotPayload,
    client: { send: (payload: HotPayload) => void },
  ) => void;
} {
  const listerMap: Record<string, Set<Function>> = {};
  const getListerMap = (e: string) => (listerMap[e] ??= new Set());

  return {
    on(event: string, listener: Function) {
      getListerMap(event).add(listener);
    },
    off(event, listener: any) {
      getListerMap(event).delete(listener);
    },
    dispatch(payload, client) {
      if (payload.type === "custom") {
        for (const lister of getListerMap(payload.event)) {
          lister(payload.data, client);
        }
      }
    },
  };
}
