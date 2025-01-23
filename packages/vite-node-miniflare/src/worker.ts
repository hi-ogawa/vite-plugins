import { DurableObject } from "cloudflare:workers";
import { objectPickBy, tinyassert } from "@hiogawa/utils";
import {
  ModuleRunner,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from "vite/module-runner";
import {
  type FetchMetadata,
  type RunnerEnv,
  type RunnerRpc,
  requestJson,
} from "./shared";

export class RunnerObject extends DurableObject implements RunnerRpc {
  #env: RunnerEnv;
  #runner?: ModuleRunner;

  constructor(...args: ConstructorParameters<typeof DurableObject>) {
    super(...args);
    this.#env = args[1] as RunnerEnv;
  }

  override async fetch(request: Request) {
    try {
      return await this.#fetch(request);
    } catch (e) {
      console.error(e);
      let body = "[vite workerd runner error]\n";
      if (e instanceof Error) {
        body += `${e.stack ?? e.message}`;
      }
      return new Response(body, { status: 500 });
    }
  }

  async #fetch(request: Request) {
    tinyassert(this.#runner);
    const options = JSON.parse(
      request.headers.get("x-vite-fetch")!,
    ) as FetchMetadata;
    const mod = await this.#runner.import(options.entry);
    const handler = mod.default as ExportedHandler;
    tinyassert(handler.fetch);

    const env = objectPickBy(this.#env, (_v, k) => !k.startsWith("__vite"));
    return handler.fetch(request, env, {
      waitUntil(_promise: Promise<any>) {},
      passThroughOnException() {},
      abort(_reason?: any) {},
    });
  }

  async __viteInit() {
    const env = this.#env;
    this.#runner = new ModuleRunner(
      {
        root: env.__viteRoot,
        sourcemapInterceptor: "prepareStackTrace",
        transport: {
          invoke: async (payload) => {
            // we still need to implement fetchModule on top of service binding
            // since websocket and rpc have tighter payload size limit
            // (for example, rpc 1MB is not enough for large pre-bundled deps with source map)
            const response = await env.__viteInvoke.fetch(requestJson(payload));
            tinyassert(response.ok);
            return response.json();
          },
          connect: async (handlers) => {
            this.#viteServerSendHandler = handlers.onMessage;
          },
          send: async (payload) => {
            const response = await env.__viteRunnerSend.fetch(
              requestJson(payload),
            );
            tinyassert(response.ok);
          },
        },
        hmr: true,
      },
      {
        runInlinedModule: async (context, transformed) => {
          const codeDefinition = `'use strict';async (${Object.keys(
            context,
          ).join(",")})=>{{`;
          const code = `${codeDefinition}${transformed}\n}}`;
          const fn = env.__viteUnsafeEval.eval(
            code,
            context[ssrImportMetaKey].filename,
          );
          await fn(...Object.values(context));
          Object.freeze(context[ssrModuleExportsKey]);
        },
        async runExternalModule(filepath) {
          return import(filepath);
        },
      },
    );
  }

  #viteServerSendHandler!: (payload: any) => void;
  async __viteServerSend(payload: any) {
    this.#viteServerSendHandler(payload);
  }
}
