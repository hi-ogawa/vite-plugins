"use client";

import React from "react";
import ReactDom from "react-dom";
import {
  addMessage,
  changeCounter,
  type getMessages,
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
        <ClearInputOnAction clear={() => setInput("")} />
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

function ClearInputOnAction(props: { clear: () => void }) {
  const { pending } = ReactDom.useFormStatus();
  const lastPending = usePrevious(pending);

  React.useEffect(() => {
    if (!pending && lastPending) {
      props.clear();
    }
  }, [pending, lastPending]);

  return <></>;
}

function usePrevious<T>(v: T) {
  const ref = React.useRef(v);

  React.useEffect(() => {
    ref.current = v;
  }, [v]);

  return ref.current;
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
      <h4 className="font-bold">Form Status</h4>
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
