"use client";

import { useActionState } from "@hiogawa/react-server/client";
import React from "react";
import ReactDom from "react-dom";
import {
  actionBindTest,
  actionCheckAnswer,
  addMessage,
  changeCounter,
  type getMessages,
  nonFormAction,
  slowAction,
} from "./_action";

export function Counter(props: { value: number }) {
  return (
    <form action={changeCounter} className="flex flex-col items-start gap-2">
      <div className="font-bold">Count: {props.value}</div>
      <div className="flex gap-2">
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={-1}
        >
          -1
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={+1}
        >
          +1
        </button>
        <div>(client form importing "use server")</div>
      </div>
    </form>
  );
}

export function Counter2({
  action,
}: {
  action: JSX.IntrinsicElements["form"]["action"];
}) {
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <div className="flex gap-2">
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={-1}
        >
          -1
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={+1}
        >
          +1
        </button>
        <div>(client form with action via server prop)</div>
      </div>
    </form>
  );
}

export function Chat(props: { messages: ReturnType<typeof getMessages> }) {
  const [input, setInput] = React.useState("");

  // clear input after submit (really this way?)
  React.useEffect(() => {
    setInput("");
  }, [props.messages]);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-bold">Messages</h4>
      <ul>
        {props.messages.map(([id, message]) => (
          <li key={id}>
            [{id}] {message}
          </li>
        ))}
      </ul>
      <form className="flex flex-col items-start gap-2" action={addMessage}>
        <div className="flex gap-2">
          <input
            name="message"
            className="antd-input px-2"
            placeholder="write something..."
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="antd-btn antd-btn-default px-2">Send</button>
        </div>
      </form>
    </div>
  );
}

export function ActionDataTest() {
  const [data, formAction, isPending] = useActionState(actionCheckAnswer, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <h4 className="font-bold">useActionState</h4>
      <div className="flex gap-2">
        <div>1 + 1 = </div>
        <input
          className="antd-input px-2 max-w-30"
          name="answer"
          placeholder="Answer?"
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
  const [data, formAction, isPending] = useActionState(nonFormAction, null);
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const delta = Number(formData.get("delta"));
        formAction(delta);
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
