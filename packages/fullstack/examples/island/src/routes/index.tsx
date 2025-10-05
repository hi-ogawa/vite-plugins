import "./server.css";

export default function IndexPage() {
  return (
    <div style={{ border: "2px solid lightseagreen", padding: "1rem" }}>
      <h4>Server only shell</h4>
      <div>SSR at {new Date().toISOString()}</div>
      <div className="test-server-style">test-server-style</div>
      <div id="client-app"></div>
    </div>
  );
}
