import { type Plugin } from "vite";
import { name as packageName } from "../package.json";

export function vitePluginErrorOverlay(options?: {
  filter?: (error: Error) => boolean;
}): Plugin {
  options?.filter;
  return {
    name: packageName,
    apply: "serve",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: CLIENT_SCRIPT,
        },
      ];
    },
  };
}

// cf. https://github.com/vitejs/vite/blob/f8e0791e3f7c7c39c041a563e77396eca706d05e/packages/vite/src/client/client.ts#L313
const CLIENT_SCRIPT = /* js */ `

// TODO: base?
import { ErrorOverlay } from "/@vite/client";

function createErrorOverlay(err) {
  document.querySelectorAll("vite-error-overlay").forEach((n) => n.close());
  document.body.appendChild(new ErrorOverlay(err));
};

window.addEventListener("error", (evt) => {
  createErrorOverlay(evt.error);
});

window.addEventListener("unhandledrejection", (evt) => {
  createErrorOverlay(evt.reason);
});

`;
