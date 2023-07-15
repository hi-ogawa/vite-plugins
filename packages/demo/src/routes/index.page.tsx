import { Err, Ok, type Result } from "@hiogawa/utils";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { cls } from "../utils/misc";
import { useEffectNoStrict } from "../utils/misc-react";
import { fetchDevDebug } from "./dev/debug.api";
import { fetchDevStream } from "./dev/stream.api";

export function Component() {
  const debugMutation = useMutation({
    mutationFn: () => fetchDevDebug(),
  });

  const streamMutation = useMutation({
    mutationFn: () => fetchDevStream(),
  });

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex flex-col gap-4 p-6">
        <div className="flex-1 flex flex-col gap-4">
          <button
            className={cls(
              "antd-btn antd-btn-primary p-1",
              debugMutation.isLoading && "antd-btn-loading"
            )}
            onClick={() => debugMutation.mutate()}
          >
            API /dev/debug
          </button>
          <pre className="min-h-[100px] max-h-xl overflow-auto p-1 border text-sm">
            {debugMutation.isSuccess &&
              JSON.stringify(debugMutation.data, null, 2)}
          </pre>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <button
            className={cls(
              "antd-btn antd-btn-primary p-1",
              debugMutation.isLoading && "antd-btn-loading"
            )}
            onClick={() => streamMutation.mutate()}
            disabled={!streamMutation.isIdle}
          >
            API /dev/stream
          </button>
          <pre className="min-h-[100px] max-h-xl overflow-auto p-1 border text-sm">
            {streamMutation.isSuccess && (
              <ReadableStreamComponent stream={streamMutation.data} />
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ReadableStreamComponent({
  stream,
}: {
  stream: ReadableStream<string>; // assume stable
}) {
  const [data, setData] = React.useState("");
  const [result, setResult] = React.useState<Result<{}, unknown>>();

  useEffectNoStrict(() => {
    const reader = stream.getReader();
    let mounted = true;

    // pull data
    (async () => {
      while (mounted) {
        const result = await reader.read();
        if (!mounted) return;

        if (result.value) {
          setData((prev) => prev + result.value);
        }
        if (result.done) {
          break;
        }
      }
    })();

    // wait for finish/error
    (async () => {
      try {
        await reader.closed;
        if (!mounted) return;
        setResult(Ok({}));
      } catch (e) {
        if (!mounted) return;
        setResult(Err(e));
      }
    })();

    return () => {
      mounted = false;
      reader.cancel();
    };
  }, []);

  return (
    <>
      (status: {result ? (result.ok ? "finished" : "error") : "loading"}){"\n"}
      {data}
    </>
  );
}
