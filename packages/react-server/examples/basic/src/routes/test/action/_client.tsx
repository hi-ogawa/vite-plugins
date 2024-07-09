"use client";

import React from "react";
import ReactDom from "react-dom";
import { useHydrated } from "../_client";
import {
  actionBindTest,
  actionCheckAnswer,
  addMessage,
  clearMessages,
  type getMessages,
  nonFormAction,
  slowAction,
} from "./_action";
import { actionReturnComponent } from "./_action2";

export function Chat(props: { messages: ReturnType<typeof getMessages> }) {
  // cf. https://react.dev/reference/react/useOptimistic#optimistically-updating-with-forms
  const [optMessages, addOptMessage] = React.useOptimistic(
    props.messages,
    (prev, data: string) => prev.concat({ id: 0, data }),
  );

  const [, addMessageClient, isPending] = React.useActionState(
    async (_: unknown, formData: FormData) => {
      addOptMessage(formData.get("message") as any);
      await addMessage(formData);
    },
    null,
  );
  const formAction = useHydrated() ? addMessageClient : addMessage;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h4 className="font-bold">Messages</h4>
        <form action={clearMessages}>
          <button className="antd-btn antd-btn-default px-2 text-sm">
            Clear
          </button>
        </form>
      </div>
      <ul>
        {optMessages.map(({ id, data }, i) => (
          <li key={i} className={id === 0 ? "text-colorTextSecondary" : ""}>
            [{id || "?"}] {data}
          </li>
        ))}
      </ul>
      <form className="flex flex-col items-start gap-2" action={formAction}>
        <div className="flex gap-2">
          <input
            name="message"
            className="antd-input px-2"
            placeholder="write something..."
            required
            disabled={isPending}
          />
          <button className="antd-btn antd-btn-default px-2">Send</button>
        </div>
      </form>
    </div>
  );
}

export function ActionDataTest() {
  const [data, formAction, isPending] = React.useActionState(
    actionCheckAnswer,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <h4 className="font-bold">useActionState</h4>
      <div className="flex gap-2">
        <div>1 + 1 = </div>
        <input
          className="antd-input px-2 max-w-30"
          name="answer"
          placeholder="Answer?"
          defaultValue={data?.answer}
          required
        />
        <div data-testid="action-state">
          {isPending ? (
            "..."
          ) : data ? (
            <>
              {data.message} (tried{" "}
              {data.count === 1 ? "once" : data.count + " times"})
            </>
          ) : null}
        </div>
      </div>
    </form>
  );
}

export function NonFormActionTest() {
  const [data, formAction, isPending] = React.useActionState(
    nonFormAction,
    null,
  );
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const delta = Number(formData.get("delta"));
        React.startTransition(() => formAction(delta));
      }}
    >
      <h4 className="font-bold">Non-form-action action</h4>
      <div className="flex gap-2">
        <input
          className="antd-input px-2 max-w-30"
          name="delta"
          placeholder="Number..."
          required
        />
        <button className="antd-btn antd-btn-default px-2">Add</button>
        <div data-testid="non-form-action-state">
          {isPending ? "..." : data}
        </div>
      </div>
    </form>
  );
}

export function ClientActionBindTest() {
  const formAction = actionBindTest.bind(null, "client-bind");
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="hello" value="world" />
      <button className="antd-input p-1 text-sm">
        Action Bind Test (client)
      </button>
    </form>
  );
}

// https://react.dev/reference/react-dom/hooks/useFormStatus
export function FormStateTest() {
  return (
    <form action={slowAction} className="flex flex-col items-start gap-2">
      <FormStateTestInner />
    </form>
  );
}

function FormStateTestInner() {
  // useFormStatus works only inside <form />
  const formStatus = ReactDom.useFormStatus();

  return (
    <>
      <h4 className="font-bold">useFormStatus</h4>
      <div className="flex gap-2">
        <button
          className="antd-btn antd-btn-default px-2"
          name="sleep"
          value={"200"}
          disabled={formStatus.pending}
        >
          0.2 sec
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          name="sleep"
          value={"1000"}
          disabled={formStatus.pending}
        >
          1.0 sec
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          name="sleep"
          value={"2000"}
          disabled={formStatus.pending}
        >
          2.0 sec
        </button>
      </div>
      <pre className="text-sm">
        <div>pending: {String(formStatus.pending)}</div>
        <div>method: {String(formStatus.method)}</div>
        <div>
          data:{" "}
          {formStatus.data
            ? JSON.stringify(formDataToJson(formStatus.data))
            : String(formStatus.data)}
        </div>
        <div>action: {String(formStatus.action)}</div>
      </pre>
    </>
  );
}

function formDataToJson(data: FormData) {
  const result: any = {};
  data.forEach((v, k) => {
    result[k] = v;
  });
  return result;
}

export function TestActionReturnComponent() {
  const [node, setNode] = React.useState<React.ReactNode>(null);
  return (
    <div
      className="flex flex-col gap-2 items-start"
      data-testid="action-return-component"
    >
      <h3 className="font-bold">TestActionReturnComponent</h3>
      <div className="flex items-center gap-2">
        <form
          action={async () => {
            setNode(await actionReturnComponent());
          }}
        >
          <button className="antd-btn antd-btn-default px-2">Action</button>
        </form>
        Result: {node ?? "(none)"}
      </div>
    </div>
  );
}

export function TestActionErrorTryCatch(props: {
  action: () => Promise<void>;
}) {
  const [error, setError] = React.useState<unknown>();
  return (
    <div className="flex flex-col gap-2 items-start">
      <div className="flex items-center gap-2">
        <form
          action={async () => {
            try {
              await props.action();
            } catch (e) {
              setError(e);
            }
          }}
        >
          <button className="antd-btn antd-btn-default px-2">
            TestActionErrorTryCatch
          </button>
        </form>
        <div data-testid="action-error-result">
          Result: {error ? String(error) : "(none)"}
        </div>
      </div>
    </div>
  );
}
