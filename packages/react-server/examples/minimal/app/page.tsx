import { TestAction } from "./_action";
import { TestClient } from "./_client";

export default function Page() {
  return (
    <>
      <div>[Page]</div>
      <TestClient />
      <form action={TestAction}>
        <button>TestAction</button>
      </form>
    </>
  );
}
