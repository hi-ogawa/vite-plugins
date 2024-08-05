import { TestEnvClient } from "./_client";
import { getTestEnv } from "./_test";

export default function Page() {
  return (
    <div className="text-sm">
      <div>
        <h3>Server component</h3>
        <pre data-testid="server-env">
          {JSON.stringify(getTestEnv(), null, 2)}
        </pre>
      </div>
      <div>
        <h3>Client component</h3>
        <pre data-testid="client-env">
          <TestEnvClient />
        </pre>
      </div>
    </div>
  );
}
