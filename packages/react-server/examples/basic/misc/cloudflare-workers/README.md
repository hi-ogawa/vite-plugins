# cloudflare-workers

scripts for Cloudflare Workers deployment

https://rsc-experiment.hiro18181.workers.dev

## todo

local preview shows a following error, but not sure if this is a false alarm
or actual mis-use of ReadableStream.

cf. https://github.com/cloudflare/workers-sdk/issues/3259

```
[wrangler:inf] GET / 200 OK (73ms)
✘ [ERROR] Your worker created multiple branches of a single stream (for instance, by calling `response.clone()` or `request.clone()`) but did not read the body of both branches. This is wasteful, as it forces the system to buffer the entire stream of data in memory, rather than streaming it through. This may cause your worker to be unexpectedly terminated for going over the memory limit. If you only meant to copy the request or response headers and metadata (e.g. in order to be able to modify them), use the appropriate constructors instead (for instance, `new Response(response.body, response)`, `new Request(request)`, etc).
```

It looks like this happens when rendering a server component with `fetch`, such as:

```tsx
// see packages/rsc/examples/basic/src/root.tsx
async function Fetch(...) {
  const res = await fetch(url);
  return <pre>{await res.text()}</pre>
}
```
