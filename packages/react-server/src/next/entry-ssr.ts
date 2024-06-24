// @ts-nocheck
// type error on initial build as it depends on itself

import { handler } from "@hiogawa/react-server/entry-server";
import { webToNodeHandler } from "@hiogawa/utils-node";

export default webToNodeHandler(handler);
