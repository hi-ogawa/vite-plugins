// based on astro-island
// https://github.com/withastro/astro/blob/1e5b72c8df709b8ab966ed1d0f74977758bbf445/packages/astro/src/runtime/server/astro-island.ts

import { h, hydrate } from "preact";

declare let __island_raw_import__: (file: string) => Promise<any>;

export class DemoIsland extends HTMLElement {
  async connectedCallback() {
    const entry = this.getAttribute("entry")!;
    const exportName = this.getAttribute("export-name")!;
    const props = JSON.parse(this.getAttribute("props")!);
    const module = await __island_raw_import__(entry);
    const Component = module[exportName];
    const vnode = h(Component, props);
    hydrate(vnode, this);
  }
}
