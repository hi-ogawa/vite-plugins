"use client";

import React from "react";
import { addMessage, changeCounter, type getMessages } from "./action";

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
