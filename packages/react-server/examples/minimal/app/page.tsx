import { changeCount, getCount } from "./_action";
import { TestClient } from "./_client";

export default function Page() {
  return (
    <div>
      <h3>[Home]</h3>
      <TestClient />
      <form action={changeCount}>
        <button>Action: {getCount()}</button>
      </form>
    </div>
  );
}
