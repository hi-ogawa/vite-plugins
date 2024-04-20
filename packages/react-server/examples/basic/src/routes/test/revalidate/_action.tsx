"use server";

import { useActionContext } from "@hiogawa/react-server/server";

export async function actionTestRevalidate() {
  useActionContext().revalidate = true;
}
