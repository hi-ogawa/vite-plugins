import viteLogo from "./vite.svg";

export default function Page() {
  return (
    <div className="flex flex-col p-2 gap-2">
      <h3 className="font-bold">Test Assets</h3>
      <div className="flex items-center gap-2">
        <img src={viteLogo} /> js import
      </div>
      <div className="flex items-center gap-2">
        <img src={viteLogo} /> css url()
      </div>
    </div>
  );
}
