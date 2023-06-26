import { useParams } from "react-router-dom";

export function Page() {
  const params = useParams();
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-xl flex flex-col gap-2 p-6">
        <h1>Dynamic route</h1>
        <pre className="font-mono">
          params = {JSON.stringify(params, null, 2)}
        </pre>
      </div>
    </div>
  );
}
