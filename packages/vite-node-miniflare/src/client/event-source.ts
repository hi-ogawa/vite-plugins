import { DefaultMap } from "@hiogawa/utils";
import { fetchEventSource } from "@microsoft/fetch-event-source";

// EventSource polyfill based on https://github.com/Azure/fetch-event-source
// since Worked doesn't have EventSource

class TypedEventTarget<T> {
  private listeners = new DefaultMap<keyof T, Set<Function>>(() => new Set());

  addEventListener<K extends keyof T>(type: K, listener: (ev: T[K]) => void) {
    this.listeners.get(type).add(listener);
  }

  removeEventListener<K extends keyof T>(
    type: K,
    listener: (ev: T[K]) => void
  ) {
    this.listeners.get(type).delete(listener);
  }

  notify<K extends keyof T>(type: K, data: T[K]) {
    for (const listener of this.listeners.get(type)) {
      listener(data);
    }
  }
}

export class FetchEventSource extends TypedEventTarget<EventSourceEventMap> {
  public fetchPromise: Promise<void>;

  constructor(public url: string) {
    super();
    console.log("[FetchEventSource]", { url });
    this.fetchPromise = fetchEventSource(url, {
      fetch: globalThis.fetch,
      openWhenHidden: true,
      onopen: async (response) => {
        console.log("[FetchEventSource.onopen]");
        this.notify("open", response as any);
      },
      onerror: (e) => {
        console.log("[FetchEventSource.onerror]");
        this.notify("error", e);
      },
      onmessage: (ev) => {
        console.log("[FetchEventSource.onmessage]", ev);
        if (!ev.data) {
          return;
        }
        this.notify("message", ev as any);
      },
      onclose: () => {
        console.log("[FetchEventSource.onclose]");
      },
    });
  }
}
