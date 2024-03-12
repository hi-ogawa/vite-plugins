"use server";

// TODO
// this file is used only in client build as server reference
// but this needs to be included in rsc build.

export async function actionClientImportOnly(formData: FormData) {
  console.log("[action] actionClientImportOnly", { formData });
}
