import buildServerReferences from "virtual:vite-rsc/server-references";

export async function preloadModule(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const import_ = buildServerReferences[id];
    if (!import_) {
      throw new Error(`server reference not found '${id}'`);
    }
    return import_();
  }
}
