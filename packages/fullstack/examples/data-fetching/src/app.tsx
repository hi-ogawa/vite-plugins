import { useSuspenseQuery } from "@tanstack/react-query";
import "./app.css";

export function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Date Fetching Example</title>
      </head>
      <body>
        <TodoApp />
      </body>
    </html>
  );
}

function TodoApp() {
  const query = useSuspenseQuery($rpcq.listItems.queryOptions());

  return (
    <main>
      <form
        action={async (formData) => {
          const title = formData.get("title");
          if (typeof title !== "string" || !title) return;
          await $rpc.addItem({ title });
          query.refetch();
        }}
      >
        <input name="title" placeholder="What needs to be done?" />
      </form>
      <ul>
        {query.data.map((item) => (
          <li key={item.id}>
            <input type="checkbox" checked={item.completed} readOnly />
            {item.title}
          </li>
        ))}
      </ul>
    </main>
  );
}
