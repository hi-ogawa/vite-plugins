import { webToNodeHandler } from "@hiogawa/utils-node";
import handler from "../../dist/server/index.js";

export default webToNodeHandler(handler);
