import { CommonComponent } from "../../components/common";
import { Counter } from "../../components/counter";

export default async function Page() {
  return (
    <div className="flex flex-col gap-2">
      <CommonComponent message="from server" />
      <div className="text-sm">
        <pre>Server Time: {new Date().toISOString()}</pre>
        <Fetch url="https://unpkg.com/react@19.0.0-rc-8f3c0525f9-20240521/package.json" />
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
