// cf. astro-island
// https://github.com/withastro/astro/blob/1e5b72c8df709b8ab966ed1d0f74977758bbf445/packages/astro/src/runtime/server/astro-island.ts

import { h, render } from "preact";

// same technique as https://github.com/vitejs/vite-plugin-react/blob/5e245aa2e2a3671c24ac57de80b5d5a690c3a704/packages/plugin-rsc/src/plugin.ts#L258-L260
declare let __island_raw_import__: (file: string) => Promise<any>;

export class DemoIsland extends HTMLElement {
  async connectedCallback() {
    const entry = this.getAttribute("entry")!;
    const exportName = this.getAttribute("export-name")!;
    const props = JSON.parse(this.getAttribute("props")!);
    const module = await __island_raw_import__(entry);
    const Component = module[exportName];
    const vnode = h(Component, props);
    render(vnode, this);
    Object.assign(this, { __island_ready__: true });
  }
}
