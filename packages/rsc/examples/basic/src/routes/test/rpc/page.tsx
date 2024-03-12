import { serverRpc } from "../../../rpc/server";
import { CounterRpc } from "./counter-rpc";

export default async function Page() {
  const value = await serverRpc.getCounter();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg">Counter RPC</h3>
      <div>Server Value: {value}</div>
      <CounterRpc value={value} />
    </div>
  );
}
