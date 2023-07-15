import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getCounterQueryOptions,
  updateCounterMutationOptions,
} from "./server-data-counter.api";

// no-op client loader to trigger server loader only on SSR
export const loader = () => null;

export function Component() {
  const counterQueryOptions = getCounterQueryOptions();
  const counterQuery = useQuery(counterQueryOptions);

  const queryClient = useQueryClient();
  const counterMutation = useMutation({
    ...updateCounterMutationOptions(),
    onSuccess: (data) => {
      toast.success("Successfully updated", { id: "counter-mutation-success" });
      queryClient.setQueryData(counterQueryOptions.queryKey, data);
    },
  });

  const loading = counterQuery.isInitialLoading || counterMutation.isLoading;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Server data</h1>
          <div className="flex items-center gap-3">
            <span>counter = {counterQuery.data ?? "..."}</span>
            {loading && <div className="antd-spin w-4 h-4"></div>}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="antd-btn antd-btn-default px-2"
              disabled={loading}
              onClick={() => counterMutation.mutate(-1)}
            >
              -1
            </button>
            <button
              className="antd-btn antd-btn-default px-2"
              disabled={loading}
              onClick={() => counterMutation.mutate(+1)}
            >
              +1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
