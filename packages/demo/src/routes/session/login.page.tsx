import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { rpcClientQuery } from "../../rpc/client";

export function Component() {
  const form = useForm({ defaultValues: { name: "" } });
  const formIsValid = form.formState.isValid;

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
          onSubmit={form.handleSubmit((data) => {
            loginMutation.mutate(data);
          })}
        >
          <label className="flex flex-col gap-1">
            <span>Name</span>
            <input
              className="antd-input px-1"
              {...form.register("name", { required: true })}
            />
          </label>
          <button
            className="antd-btn antd-btn-primary px-1"
            disabled={!formIsValid}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
