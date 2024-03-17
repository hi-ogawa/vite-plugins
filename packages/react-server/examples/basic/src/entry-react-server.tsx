import {
  type ReactServerHandler,
  handler as baseHandler,
} from "@hiogawa/react-server/entry-react-server";

// TODO: demo custom handler

export const handler: ReactServerHandler = (ctx) => {
  return baseHandler(ctx);
};
