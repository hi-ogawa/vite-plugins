import "./index.css";
import Client from "../components/client?island";

export default async function Page() {
  return (
    <div style={{ border: "2px solid lightseagreen", padding: "1rem" }}>
      <h4>Server only shell</h4>
      <div>SSR at {new Date().toISOString()}</div>
      <div className="test-server-style">test-server-style</div>
      <Client />
    </div>
  );
}
