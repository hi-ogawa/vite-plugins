import { useMatches } from "react-router-dom";

export const handle = "subdir-other-handle";

export function Component() {
  const matches = useMatches();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-2">
          Sub directory (other)
          <pre className="text-sm border p-2">
            useMatches() = {JSON.stringify(matches, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
