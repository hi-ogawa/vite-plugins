export default function AboutPage() {
  return (
    <div style={{ border: "2px solid lightcoral", padding: "1rem" }}>
      <h4>About Page</h4>
      <div>SSR at {new Date().toISOString()}</div>
    </div>
  );
}
