export function setRequireModule(options: {
  load: (id: string) => Promise<unknown>;
}): void {
  clientManifest.load = options.load;
}

export const clientManifest: any = {};
