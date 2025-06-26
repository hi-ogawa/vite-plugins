import { TestActionStateClient } from "./client";

export function TestActionStateServer() {
  const time = new Date().toISOString();
  return (
    <div>
      <TestActionStateClient
        fn={async () => {
          "use server";
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return <span>Action completed on server at {time}!</span>;
        }}
      />
    </div>
  );
}
