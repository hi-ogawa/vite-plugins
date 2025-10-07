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
      <div className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <form
            action={async (formData) => {
              const title = formData.get("title");
              if (typeof title !== "string" || !title) return;
              await $rpc.addItem({ title });
              query.refetch();
            }}
          >
            <input
              name="title"
              className="new-todo"
              placeholder="What needs to be done?"
              autoFocus
            />
          </form>
        </header>
        {query.data.length > 0 && (
          <section className="main">
            <ul className="todo-list">
              {query.data.map((item) => (
                <li key={item.id} className={item.completed ? "completed" : ""}>
                  <div className="view">
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={item.completed}
                      onChange={async () => {
                        await $rpc.toggleItem({ id: item.id });
                        query.refetch();
                      }}
                    />
                    <label>{item.title}</label>
                    <button
                      type="button"
                      className="destroy"
                      onClick={async () => {
                        await $rpc.removeItem({ id: item.id });
                        query.refetch();
                      }}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
