export async function importRsc<T>(): Promise<T> {
  const mod = await import("virtual:vite-rsc/import-rsc" as any);
  if (import.meta.env.DEV) {
    return mod.default();
  } else {
    return mod;
  }
}

export async function importSsrAssets() {
  // TODO
}
