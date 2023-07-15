import { useMatches } from "react-router-dom";

export const handle = "subdir-other-handle";

export function Component() {
  const matches = useMatches();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-2">
          Sub directory (other)
          <div className="flex flex-col gap-2 p-2 border text-sm">
            <pre>useMatches()</pre>
            {matches.map((m) => (
              <pre key={m.id} data-testid={m.id}>
                {JSON.stringify(m, null, 2)}
              </pre>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
