import {
  actionBindTest,
  changeCounter,
  getActionBindResult,
  getCounter,
  getMessages,
} from "./_action";
import {
  ActionDataTest,
  Chat,
  ClientActionBindTest,
  Counter,
  Counter2,
  FormStateTest,
  NonFormActionTest,
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
      <NonFormActionTest />
      <div className="flex flex-col gap-2">
        <h4 className="font-bold">Action Bind</h4>
        <ServerActionBindTest />
        <ClientActionBindTest />
        <div data-testid="action-bind">{getActionBindResult()}</div>
      </div>
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

function ServerActionBindTest() {
  const formAction = actionBindTest.bind(null, "server-bind");
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="hello" value="world" />
      <button className="antd-input p-1 text-sm">
        Action Bind Test (server)
      </button>
    </form>
  );
}
