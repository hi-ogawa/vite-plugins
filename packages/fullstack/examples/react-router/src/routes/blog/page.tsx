import { Link } from "react-router";

export function Component() {
  const posts = [
    {
      slug: "vite-tips",
      title: "Vite Tips & Tricks",
      date: "January 20, 2024",
    },
    { slug: "hello-world", title: "Hello World", date: "January 15, 2024" },
  ];

  return (
    <main>
      <h1>Blog</h1>
      {posts.map((post) => (
        <div key={post.slug} className="card">
          <h3>
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>
          <p className="post-meta">{post.date}</p>
        </div>
      ))}
    </main>
  );
}
