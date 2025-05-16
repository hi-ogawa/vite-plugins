export type { NodePath, Node } from "@babel/traverse";
export type { types } from "@babel/core";
export { parse, type ParseResult } from "@babel/parser";
// export { default as traverse } from "@babel/traverse";
// export { default as generate } from "@babel/generator";
export type { File } from "@babel/types";
export { cloneNode } from "@babel/types";

import traverse_ from "@babel/traverse";
export const traverse: typeof import("@babel/traverse").default =
  (traverse_ as any).default || traverse_;
import generator_ from "@babel/generator";
export const generate: typeof import("@babel/generator").default =
  (generator_ as any).default || generator_;
