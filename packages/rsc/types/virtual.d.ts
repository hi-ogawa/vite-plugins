declare module "virtual:vite-rsc/importer-resources" {
  export const resources: { js: string[]; css: string[] };
  export function Resources(props: {
    nonce?: string;
  }): import("react").JSX.Element;
}
