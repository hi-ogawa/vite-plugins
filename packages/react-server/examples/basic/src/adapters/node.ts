import { webToNodeHandler } from "@hiogawa/utils-node";
import { handler } from "../entry-server";

export default webToNodeHandler(handler);
