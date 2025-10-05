import { Link } from "react-router";

export function Component() {
  const posts = [
    { slug: "hello-world", title: "Hello World", date: "January 15, 2024" },
    {
      slug: "vite-tips",
      title: "Vite Tips & Tricks",
      date: "January 20, 2024",
    },
  ];

  return (
    <main>
      <h1>Blog</h1>
      <div className="card">
        <p>Welcome to our blog!</p>
      </div>
      {posts.map((post) => (
        <div key={post.slug} className="card">
          <h3>
            <Link to={`/blog/${post.slug}`} style={{ color: "#646cff" }}>
              {post.title}
            </Link>
          </h3>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{post.date}</p>
        </div>
      ))}
    </main>
  );
}
