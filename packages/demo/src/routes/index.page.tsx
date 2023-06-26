import { useMutation } from "@tanstack/react-query";
import { cls } from "../utils/misc";
import { fetchDevDebug } from "./dev/debug.api";

export function Component() {
  const debugMutation = useMutation({
    mutationFn: () => fetchDevDebug(),
  });

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <button
            className={cls(
              "antd-btn antd-btn-primary p-1",
              debugMutation.isLoading && "antd-btn-loading"
            )}
            onClick={() => debugMutation.mutate()}
          >
            Fetch API
          </button>
          {debugMutation.isSuccess && (
            <pre className="overflow-auto p-1 border text-sm">
              {JSON.stringify(debugMutation.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
