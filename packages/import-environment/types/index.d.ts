declare global {
  interface ImportMeta {
    loadEnvironmentModule: <T>(
      environmentName: string,
      entryName?: string,
    ) => Promise<T>;
  }
}

export {};
