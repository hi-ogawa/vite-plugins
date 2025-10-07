import { os, ORPCError } from "@orpc/server";
import * as z from "zod";

const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

type Item = z.infer<typeof ItemSchema>;
const items: Item[] = [];

const listItems = os.handler(async () => {
  return items;
});

const addItem = os
  .input(
    z.object({
      title: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const id = Math.random().toString(36).substring(2);
    items.push({ id, title: input.title, completed: false });
  });

const removeItem = os
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const idx = items.findIndex((x) => x.id === input.id);
    if (idx === -1) {
      throw new ORPCError("NOT_FOUND");
    }
    items.splice(idx, 1);
  });

const toggleItem = os
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const item = items.find((x) => x.id === input.id);
    if (!item) {
      throw new ORPCError("NOT_FOUND");
    }
    item.completed = !item.completed;
  });

export const __rpc_router__ = {
  listItems,
  addItem,
  removeItem,
  toggleItem,
};
