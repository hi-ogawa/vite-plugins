import { TestEnvClient } from "./_client";
import { getTestEnv } from "./_test";

export default function Page() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h2 className="font-bold">Test Env</h2>
      <div>
        <h3>Server component</h3>
        <pre className="text-sm" data-testid="server-env">
          {JSON.stringify(getTestEnv(), null, 2)}
        </pre>
      </div>
      <div>
        <h3>Client component</h3>
        <pre className="text-sm" data-testid="client-env">
          <TestEnvClient />
        </pre>
      </div>
    </div>
  );
}
