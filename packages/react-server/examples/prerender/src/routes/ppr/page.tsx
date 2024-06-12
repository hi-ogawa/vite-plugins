export default async function Page() {
  await new Promise((r) => setTimeout(r, 1000));
  return <div>Page</div>;
}
