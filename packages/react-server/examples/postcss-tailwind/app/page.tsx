import { TestClient } from "./_client";

export default function Page() {
  return (
    <div className="flex flex-col gap-2 p-2 text-xl items-start">
      <TestServer />
      <TestClient />
    </div>
  );
}

let serverCount = 0;

function TestServer() {
  return (
    <form
      action={async () => {
        "use server";
        serverCount += 1;
      }}
    >
      <button className="p-2 text-orange-500 rounded-xl border flex items-center hover:shadow">
        Test Server: {serverCount}
      </button>
    </form>
  );
}
