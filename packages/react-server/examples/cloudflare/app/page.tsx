import { changeCount, getCount } from "./_action";
import { TestClient } from "./_client";

export default function Page() {
  return (
    <>
      <div>[Page]</div>
      <TestClient />
      <form action={changeCount}>
        <button>Action: {getCount()}</button>
      </form>
    </>
  );
}
