import { revalidatePath as revalidatePath_ } from "@hiogawa/react-server/server";

export function revalidatePath(
  path: string,
  /** @todo */
  _type?: "layout" | "page",
) {
  return revalidatePath_(path);
}

/** @todo */
export function revalidateTag(_tag: string) {}
