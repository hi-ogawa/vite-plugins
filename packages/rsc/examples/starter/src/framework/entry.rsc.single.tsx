import handler from "./entry.rsc.tsx";

export default function singleHandler(request: Request) {
  return handler(request, () => import.meta.viteRsc.loadSsrModule("index"));
}
