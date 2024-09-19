// use declaration merging
export interface Platform {}

export function getPlatform(): Platform {
  return (globalThis as any).__REACT_SERVER_GET_PLATFORM?.();
}
