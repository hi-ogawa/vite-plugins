import {
  actionTestRevalidate,
  changeCounter,
  getCounter,
  getMessages,
} from "./_action";
import {
  ActionDataTest,
  Chat,
  Counter,
  Counter2,
  FormStateTest,
} from "./_client";

export default async function Page() {
  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <Counter value={getCounter()} />
        <Counter2 action={changeCounter} />
        <Counter3 />
      </div>
      <Chat messages={getMessages()} />
      <ActionDataTest />
      <form action={actionTestRevalidate} className="flex flex-col gap-2">
        <h4 className="font-bold">Action Revalidate</h4>
        <button className="antd-btn antd-btn-default w-sm">Revalidate!</button>
      </form>
      <FormStateTest />
    </div>
  );
}

function Counter3() {
  return (
    <form action={changeCounter} className="flex flex-col items-start gap-2">
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
        <div>(server form)</div>
      </div>
    </form>
  );
}
