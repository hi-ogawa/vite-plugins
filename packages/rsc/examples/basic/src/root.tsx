import { Counter } from "./components/counter";
import { Header } from "./components/header";

// TODO: full <html> render?

export async function Root() {
  return (
    <div>
      <Header />
      <div>
        <pre>Server time: {new Date().toString()}</pre>
        <Fetch url="https://unpkg.com/react@18.3.0-canary-6c3b8dbfe-20240226/package.json" />
      </div>
      <div>
        <h4>Client component</h4>
        <Counter defaultValue={1234} />
      </div>
    </div>
  );
}

async function Fetch({ url }: { url: string }) {
  const res = await fetch(url);
  const resText = await res.text();
  return <pre>{`Fetch ${url}\n${resText.slice(0, 200)}...`}</pre>;
}
