import { handler } from "@hiogawa/react-server/entry/ssr";
import { webToNodeHandler } from "@hiogawa/utils-node";

export default webToNodeHandler(handler);
