// use declaration merging
export interface Platform {}

// use alias to switch platform implementation
export function getPlatform(): Platform {
  throw new Error("unavailable getPlatform()");
}
