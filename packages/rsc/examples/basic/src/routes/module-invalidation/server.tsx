import { counter } from "./server-dep";

export function TestModuleInvalidationServer() {
  return (
    <div>
      <form
        action={async () => {
          "use server";
          counter.value ^= 1;
        }}
      >
        <button>test-module-invalidation-server</button>[{counter.value}]
      </form>
    </div>
  );
}
