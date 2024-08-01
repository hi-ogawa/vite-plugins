import { tinyassert } from "@hiogawa/utils";
import { ModuleRunner } from "vite/module-runner";
import {
  ANY_URL,
  type FetchMetadata,
  RUNNER_INIT_PATH,
  type RunnerEnv,
} from "./shared";

export class RunnerObject implements DurableObject {
  #env: RunnerEnv;
  #runner?: ModuleRunner;

  constructor(_state: DurableObjectState, env: RunnerEnv) {
    this.#env = env;
  }

  async fetch(request: Request) {
    try {
      return await this.#fetch(request);
    } catch (e) {
      console.error(e);
      let body = "[vite-node-miniflare error]\n";
      if (e instanceof Error) {
        body += `${e.stack ?? e.message}`;
      }
      return new Response(body, { status: 500 });
    }
  }

  async #fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === RUNNER_INIT_PATH) {
      const pair = new WebSocketPair();
      (pair[0] as any).accept();
      tinyassert(!this.#runner);
      this.#runner = createRunner(this.#env, pair[0]);
      return new Response(null, { status: 101, webSocket: pair[1] });
    }

    tinyassert(this.#runner);
    const options = JSON.parse(
      request.headers.get("x-vite-fetch")!,
    ) as FetchMetadata;
    const mod = await this.#runner.import(options.entry);
    const handler = mod.default as ExportedHandler;
    tinyassert(handler.fetch);

    return handler.fetch(request, this.#env, {
      waitUntil(_promise: Promise<any>) {},
      passThroughOnException() {},
      abort(_reason?: any) {},
    });
  }
}

function createRunner(env: RunnerEnv, webSocket: WebSocket) {
  return new ModuleRunner(
    {
      root: env.__viteOptions.root,
      sourcemapInterceptor: "prepareStackTrace",
      transport: {
        fetchModule: async (...args) => {
          const response = await env.__viteFetchModule.fetch(
            new Request(ANY_URL, {
              method: "POST",
              body: JSON.stringify(args),
            }),
          );
          tinyassert(response.ok);
          const result = response.json();
          return result as any;
        },
      },
      hmr: env.__viteOptions.hmr && {
        connection: {
          isReady: () => true,
          onUpdate(callback) {
            webSocket.addEventListener("message", (event) => {
              callback(JSON.parse(event.data));
            });
          },
          send(messages) {
            webSocket.send(JSON.stringify(messages));
          },
        },
      },
    },
    {
      runInlinedModule: async (context, transformed, id) => {
        const codeDefinition = `'use strict';async (${Object.keys(context).join(
          ",",
        )})=>{{`;
        const code = `${codeDefinition}${transformed}\n}}`;
        const fn = env.__viteUnsafeEval.eval(code, id);
        await fn(...Object.values(context));
        Object.freeze(context.__vite_ssr_exports__);
      },
      async runExternalModule(filepath) {
        // with nodejs_compat, workerd can import node:util etc... as external module
        return import(filepath);
      },
    },
  );
}
