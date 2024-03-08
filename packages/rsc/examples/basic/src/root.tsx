import { Counter } from "./components/counter";
import { Header } from "./components/header";

// TODO: full <html> render?
export async function Root() {
  return (
    <div>
      <Header />
      <div>
        <Async />
      </div>
      <div>
        <h4>Client component</h4>
        <Counter defaultValue={1234} />
      </div>
    </div>
  );
}

async function Async() {
  const url =
    "https://unpkg.com/react@18.3.0-canary-6c3b8dbfe-20240226/package.json";
  const res = await fetch(url);
  return (
    <pre>{`fetch("${url}")\n` + (await res.text()).slice(0, 200) + "..."}</pre>
  );
}
