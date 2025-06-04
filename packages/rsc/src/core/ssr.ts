export function setRequireModule(options: {
  load: (id: string) => unknown;
}): void {
  clientManifest.load = options.load;
}

export const clientManifest: any = {};
