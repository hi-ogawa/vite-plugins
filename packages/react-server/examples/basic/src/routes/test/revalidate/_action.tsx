"use server";

import { revalidatePath } from "@hiogawa/react-server/server";

export async function actionTestRevalidate() {
  revalidatePath("/");
}
