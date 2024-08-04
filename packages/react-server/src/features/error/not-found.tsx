// https://github.com/vercel/next.js/blob/c74f3f54b23b3fc47dc7e214a8949844257a734a/packages/next/src/build/webpack/loaders/next-app-loader.ts#L72
// https://github.com/vercel/next.js/blob/8f5f0ef141a907d083eedb7c7aca52b04f9d258b/packages/next/src/client/components/not-found-error.tsx#L34-L39
export function DefaultNotFoundPage() {
  return (
    <>
      <h1>404 Not Found</h1>
      <div>
        Back to <a href="/">Home</a>
      </div>
    </>
  );
}
