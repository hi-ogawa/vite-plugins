import { CommonComponent } from "../components/common";
import { Counter } from "../components/counter";
import { Header } from "../components/header";

// TODO: full <html> render?

export async function Page() {
  const counterDefaultValue = Math.floor(Math.random() * 1000);
  return (
    <div>
      <Header />
      <CommonComponent />
      <div>
        <pre>Server Time: {new Date().toString()}</pre>
        <Fetch url="https://unpkg.com/react@18.3.0-canary-6c3b8dbfe-20240226/package.json" />
      </div>
      <div>
        <div>
          Counter defaultValue: {counterDefaultValue} (prop from server to
          client)
        </div>
        <h4>Client component</h4>
        <Counter defaultValue={counterDefaultValue} />
      </div>
    </div>
  );
}

async function Fetch({ url }: { url: string }) {
  const res = await fetch(url);
  const resText = await res.text();
  return <pre>{`Fetch ${url}\n${resText.slice(0, 200)}...`}</pre>;
}
