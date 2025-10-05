export function Component() {
  return (
    <main>
      <h1>Hello World</h1>
      <div className="card">
        <p style={{ color: "#666", marginBottom: "1rem" }}>January 15, 2024</p>
        <p>
          This is our first blog post! This example demonstrates how nested
          routes work with import.meta.glob patterns.
        </p>
        <p>
          The glob pattern automatically discovers all page.tsx files in the
          routes directory, creating the routing structure.
        </p>
      </div>
    </main>
  );
}
