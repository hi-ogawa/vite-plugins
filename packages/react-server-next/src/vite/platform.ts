// use declaration merging
export interface Platform {}

export function getPlatform(): Platform {
  throw new Error("unavailable getPlatform()");
}
