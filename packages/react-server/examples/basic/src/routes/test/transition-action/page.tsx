import { getCounter } from "./_action";
import { Counter } from "./_client";

export default async function Page() {
  return (
    <div className="w-lg flex flex-col gap-4 p-4">
      <div className="border p-3 flex flex-col gap-2">
        <h4 className="font-bold">Action state</h4>
        <Counter value={getCounter()} />
      </div>
    </div>
  );
}
