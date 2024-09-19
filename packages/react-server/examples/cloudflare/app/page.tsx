import { changeCount, getCount } from "./_action";
import { TestClient } from "./_client";

export default async function Page() {
  return (
    <>
      <div>[Page]</div>
      <TestClient />
      <form action={changeCount}>
        <button>Action: {await getCount()}</button>
      </form>
    </>
  );
}
