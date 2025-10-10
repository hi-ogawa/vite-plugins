import "./index.css";
import { Counter } from "../islands/counter";

export default async function Page() {
  return (
    <main>
      <div className="hero">
        <h1>Island Framework</h1>
        <p class="subtitle">This is static</p>
      </div>
      <Counter defaultValue={2} />
    </main>
  );
}
