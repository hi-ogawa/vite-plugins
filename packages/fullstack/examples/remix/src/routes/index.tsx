import "./index.css";
import { Counter } from "../islands/counter";

export default async function Page() {
  return (
    <main>
      <div className="hero">
        <h1>Remix Framework</h1>
      </div>
      <Counter initialCount={2} />
    </main>
  );
}
