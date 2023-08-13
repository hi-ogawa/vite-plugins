import type { createStaticHandler } from "react-router-dom/server";

// typings from "@remix-run/router"
// for now just derive it from "react-router" exports
export type RouterStaticHandler = ReturnType<typeof createStaticHandler>;
