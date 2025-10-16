import { createFrame } from "@remix-run/dom";

// same technique as https://github.com/vitejs/vite-plugin-react/blob/5e245aa2e2a3671c24ac57de80b5d5a690c3a704/packages/plugin-rsc/src/plugin.ts#L258-L260
declare let __island_raw_import__: (file: string) => Promise<any>;

// based on https://github.com/remix-run/remix/blob/90d4fb75dfc14e70d12a903019aaab189b922ff7/demos/bookstore/app/assets/entry.tsx
// using `document.body` instead of `document` since otherwise "server:update" re-rendering is broken.
const mainFrame = createFrame(document.body, {
  async loadModule(moduleUrl, name) {
    let mod = await __island_raw_import__(moduleUrl);
    if (!mod) {
      throw new Error(`Unknown module: ${moduleUrl}#${name}`);
    }

    let Component = mod[name];
    if (!Component) {
      throw new Error(`Unknown component: ${moduleUrl}#${name}`);
    }

    return Component;
  },

  async resolveFrame(frameUrl) {
    let res = await fetch(frameUrl);
    if (res.ok) {
      return res.text();
    }

    throw new Error(`Failed to fetch ${frameUrl}`);
  },
});

if (import.meta.hot) {
  import.meta.hot.on("server:update", async (e) => {
    console.log("[server:update]", e);
    const res = await fetch(window.location.href);
    // extract <body>...</body> to avoid re-injecting <head> on HMR
    const html = await res.text();
    const body = html.match(/<body>(.*?)<\/body>/s)?.[1];
    mainFrame.render(body!);
  });
}
