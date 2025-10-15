import "./index.css";
import { Counter } from "../islands/counter";

export default async function Page() {
  return (
    <main>
      <div className="hero">
        <h1>Island Framework</h1>
        <p class="subtitle">Remix Hydrated Comopnents and Frames!</p>
      </div>
      <Counter initialCount={2} />
    </main>
  );
}
