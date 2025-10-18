import type { Remix } from "@remix-run/dom";
import { jsx } from "@remix-run/dom/jsx-runtime";
import type { RefreshRuntimeOptions } from "./transform";

const HMR_MANAGER_KEY = Symbol.for("remix-hmr-manager");

export interface ViteHot {
  accept: (onNewModule: (newModule?: unknown) => void) => void;
  invalidate: (message?: string) => void;
  data: HotData;
}

type HotData = {
  [HMR_MANAGER_KEY]?: Manager;
};

interface ProxyEntry {
  Component: Remix.Component;
  listeners: Set<() => void>;
}

interface ComponentEntry {
  Component: Remix.Component;
  key: string;
}

// Manager is singleton per file
class Manager {
  public proxyMap = new Map<string, ProxyEntry>();
  public componentMap = new Map<string, ComponentEntry>();
  public setup = () => {};

  constructor(public options: RefreshRuntimeOptions) {}

  wrap(name: string, Component: FC, key: string): FC {
    this.componentMap.set(name, { Component, key });
    let proxy = this.proxyMap.get(name);
    if (!proxy) {
      proxy = createProxyComponent(this, name);
      this.proxyMap.set(name, proxy);
    }
    return proxy.Component;
  }

  patch() {
    const componentNames = new Set([
      ...this.proxyMap.keys(),
      ...this.componentMap.keys(),
    ]);
    for (const name of componentNames) {
      const proxy = this.proxyMap.get(name);
      const current = this.componentMap.get(name);
      if (!proxy || !current) {
        return false;
      }
      if (this.options.debug) {
        console.debug(
          `[remix-hmr] refresh '${name}' (key = ${current.key}, listeners.size = ${proxy.listeners.size})`,
        );
      }
      for (const listener of proxy.listeners) {
        listener();
      }
    }
    return true;
  }
}

function createProxyComponent(manager: Manager, name: string): ProxyEntry {
  const listeners = new Set<() => void>();

  // TODO: how to preserve state?
  // For example, Vue SFC compiles "setup" part and "template" part as separate function,
  // then variables from "setup" are passed "template" render function arguments.
  // For Remix 3, state is entirely managed through closure scope,
  // so there's no way to preserve original "setup" state for updated "render" function.

  const ProxyComponent: Remix.Component = function (this) {
    listeners.add(() => this.update());

    // TODO: do we call setup for the first time and somehow patch it up later?
    // const data = manager.componentMap.get(name)!;
    // let result = data.Component.apply(this, [props]);
    // if (typeof result !== 'function') {
    //   return () => result;
    // }

    return (props) => {
      const data = manager.componentMap.get(name)!;
      // TODO: this obviously remounts entire component since updated `Component` has a new identity.
      return jsx(data.Component as any, props);
    };
  };

  Object.defineProperty(ProxyComponent, "name", { value: `${name}@hmr` });

  return { Component: ProxyComponent, listeners };
}

//
// HMR API integration
//

export function initialize(hot: ViteHot, options: RefreshRuntimeOptions) {
  const manager = (hot.data[HMR_MANAGER_KEY] ??= new Manager(options));

  // https://vitejs.dev/guide/api-hmr.html#hot-accept-cb
  hot.accept((newModule) => {
    const ok = newModule && manager.patch();
    if (!ok) {
      hot.invalidate();
    }
  });

  return manager;
}
