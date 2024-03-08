import { createClientReference } from "../utils-rsc";
import { Counter } from "./counter";

// manually setup client references
// TODO: transform plugin for "use client"
export const CounterReference = createClientReference(Counter);
