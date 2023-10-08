import { PreactToastManager } from "@hiogawa/tiny-toast/dist/preact";

export const toast = new PreactToastManager();
toast.defaultOptions.class = "!antd-floating";
