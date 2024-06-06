import { Link } from "@hiogawa/react-server/client";
import type { LayoutProps } from "@hiogawa/react-server/server";

export type PostType = {
  id: string;
  title: string;
  body: string;
};

export async function fetchPosts() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  const posts: PostType[] = await res.json();
  return posts.slice(0, 10);
}

export default async function Layout(props: LayoutProps) {
  const posts = await fetchPosts();

  return (
    <div>
      <h2>Posts</h2>
      <ul>
        {posts.slice(0, 10).map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`}>
              {post.title.substring(0, 20)}
            </Link>
          </li>
        ))}
      </ul>
      {props.children}
    </div>
  );
}
