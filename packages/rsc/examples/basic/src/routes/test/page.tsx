import { CommonComponent } from "../../components/common";
import { Counter } from "../../components/counter";

// TODO(test): hmr rsc
export default async function Page() {
  return (
    <div className="flex flex-col gap-2">
      <CommonComponent message="from server" />
      <div className="text-sm">
        <pre>Server Time: {new Date().toISOString()}</pre>
        <Fetch url="https://unpkg.com/react@18.3.0-canary-6c3b8dbfe-20240226/package.json" />
      </div>
      <Counter />
    </div>
  );
}

async function Fetch({ url }: { url: string }) {
  const res = await fetch(url);
  const resText = await res.text();
  return <pre>{`Fetch ${url}\n${resText.slice(0, 200)}...`}</pre>;
}
