import { Counter } from "./client";
import { getCounter } from "./server";

export default async function Page() {
  return (
    <div>
      <Counter value={getCounter()} />
    </div>
  );
}
