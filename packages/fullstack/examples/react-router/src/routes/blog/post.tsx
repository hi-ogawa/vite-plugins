interface BlogPostProps {
  title: string;
  date: string;
  children: React.ReactNode;
}

export function BlogPost({ title, date, children }: BlogPostProps) {
  return (
    <main>
      <h1>{title}</h1>
      <div className="card">
        <p className="post-date">{date}</p>
        {children}
      </div>
    </main>
  );
}
