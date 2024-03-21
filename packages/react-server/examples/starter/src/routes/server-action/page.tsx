import { getCounter } from "./_action";
import { Counter } from "./_client";

export default async function Page() {
  return (
    <div>
      <Counter value={getCounter()} />
    </div>
  );
}
