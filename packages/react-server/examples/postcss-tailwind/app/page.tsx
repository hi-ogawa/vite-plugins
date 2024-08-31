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
      action={() => {
        "use server";
        serverCount += 1;
      }}
    >
      <button className="text-orange-500 p-2 px-3 rounded-xl border flex items-center">
        Test Server: {serverCount}
      </button>
    </form>
  );
}
