import { Counter } from "./client";
import { getCounter } from "./server";

export default async function Page() {
  return (
    <div>
      <h4>Counter (Server state)</h4>
      <Counter value={getCounter()} />
    </div>
  );
}
