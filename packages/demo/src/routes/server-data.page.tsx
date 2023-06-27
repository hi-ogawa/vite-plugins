import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { trpcQ } from "../trpc/client-react-query";

export function Component() {
  const counterQuery = useQuery(trpcQ.getCounter.queryOptions());

  const queryClient = useQueryClient();
  const counterMutation = useMutation({
    ...trpcQ.updateCounter.mutationOptions(),
    onSuccess: (data) => {
      toast.success("Successfully updated", { id: "counter-mutation-success" });
      queryClient.setQueryData(trpcQ.getCounter.queryOptions().queryKey, data);
    },
  });

  const loading = counterQuery.isFetching || counterMutation.isLoading;

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
              onClick={() => counterMutation.mutate({ delta: -1 })}
            >
              -1
            </button>
            <button
              className="antd-btn antd-btn-default px-2"
              disabled={loading}
              onClick={() => counterMutation.mutate({ delta: +1 })}
            >
              +1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
