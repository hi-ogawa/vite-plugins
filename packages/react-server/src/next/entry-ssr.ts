// @ts-nocheck

import { handler } from "@hiogawa/react-server/entry-server";
import { webToNodeHandler } from "@hiogawa/utils-node";

export default webToNodeHandler(handler);
