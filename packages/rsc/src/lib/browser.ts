export function hydrate(options?: {
  serverCallback?: () => void;
  onHmrReload?: () => void;
}): void {
  const el = document.createElement("div");
  el.textContent = "hello client!";
  document.body.appendChild(el);

  // TODO
  options?.serverCallback;

  if (import.meta.hot && options?.onHmrReload) {
    const onHmrReload = options?.onHmrReload;
    import.meta.hot.on("rsc:update", () => onHmrReload());
  }
}

// TODO
export function fetchRSC(): void {}
