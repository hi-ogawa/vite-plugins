// use declaration merging
export interface Platform {}

// use alias
export function getPlatform(): Platform {
  throw new Error("unavailable getPlatform()");
}
