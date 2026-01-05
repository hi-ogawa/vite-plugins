import type { ReactFormState } from "react-dom/client";
import type { ReactServerErrorContext } from "../../server";

export { registerServerReference } from "@vitejs/plugin-rsc/rsc";

export type ActionResult = {
  error?: ReactServerErrorContext;
  data?: ReactFormState | null;
};

// @vitejs/plugin-rsc/rsc auto-initializes server references
// No initialization needed
