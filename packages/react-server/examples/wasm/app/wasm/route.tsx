// import someWasm from "./test.wasm";
// TODO:
// - dev: replace with
//     export default WebAssembly.compile(...)
// - build: need esbuild-like copy loader for all three steps
//     server build
//     ssr build
//     adapter bundle

export function GET(request: Request) {
  request;
  return new Response("hello");
}
