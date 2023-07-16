import { useMutation } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { useLoaderData } from "react-router-dom";
import { updateCounterClient } from "./loader-data-counter.api";
import type { LoaderData } from "./loader-data.page.server";

export function Component() {
  const loaderData = useLoaderData() as LoaderData;
  const [counter, setCounter] = React.useState(() => loaderData.counter);

  const counterMutation = useMutation({
    mutationFn: updateCounterClient,
    onSuccess: (data) => {
      toast.success("Successfully updated", { id: "counter-mutation-success" });
      setCounter(data);
    },
  });

  const loading = counterMutation.isLoading;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          <h1>Loader data</h1>
          <div className="flex items-center gap-3">
            <span>counter = {counter}</span>
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
