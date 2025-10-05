import { BlogPost } from "../post";

export function Component() {
  return (
    <BlogPost title="Hello World" date="January 15, 2024">
      <p>
        This is our first blog post! This example demonstrates how nested routes
        work with import.meta.glob patterns.
      </p>
      <p>
        The glob pattern automatically discovers all page.tsx files in the
        routes directory, creating the routing structure.
      </p>
    </BlogPost>
  );
}
