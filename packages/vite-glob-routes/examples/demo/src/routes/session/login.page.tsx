import { useTinyForm } from "@hiogawa/tiny-form/dist/react";
import { useMutation } from "@tanstack/react-query";
import { rpcClientQuery } from "../../rpc/client";

export function Component() {
  const form = useTinyForm({ name: "" });

  const loginMutation = useMutation({
    ...rpcClientQuery.login.mutationOptions(),
    onSuccess: () => {
      window.location.href = "/session";
    },
  });

  return (
    <div className="flex flex-col items-center">
      <div className="w-full p-6">
        <form
          className="flex flex-col gap-3"
          onSubmit={form.handleSubmit(() => {
            loginMutation.mutate(form.data);
          })}
        >
          <label className="flex flex-col gap-1">
            <span>Name</span>
            <input className="antd-input px-1" {...form.fields.name.props()} />
          </label>
          <button
            className="antd-btn antd-btn-primary px-1"
            disabled={!form.data.name}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
