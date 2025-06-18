export type CallServerCallback = (id: string, args: unknown[]) => unknown;

export type PrepareDestinationManifest = Record<string, string[]>;

declare global {
  var __vite_rsc_raw_import__: (id: string) => unknown;
}
