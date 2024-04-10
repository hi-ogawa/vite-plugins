"use server";

import type { ActionContext } from "@hiogawa/react-server/server";

export async function actionTestRevalidate(this: ActionContext) {
  this.revalidate = true;
}
