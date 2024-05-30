import { changeCount1, count1 } from "./_action";
import { Counter3 } from "./_client";

export default function Page() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="font-bold">Server Action Extra</h3>
      <div className="flex flex-col gap-2 p-2">
        <h4>"use server" file + server component</h4>
        <form
          action={changeCount1}
          data-testid="counter1"
          className="flex items-center gap-2"
        >
          <button
            className="antd-btn antd-btn-default px-2"
            name="value"
            value={-1}
          >
            -1
          </button>
          <button
            className="antd-btn antd-btn-default px-2"
            name="value"
            value={+1}
          >
            +1
          </button>
          <div>Count: {count1}</div>
        </form>
      </div>
      <div className="border-t"></div>
      <div className="flex flex-col gap-2 p-2">
        <h4>"use server" top-level function + server component</h4>
        <form
          action={changeCount2}
          data-testid="counter2"
          className="flex items-center gap-2"
        >
          <button
            className="antd-btn antd-btn-default px-2"
            name="value"
            value={-1}
          >
            -1
          </button>
          <button
            className="antd-btn antd-btn-default px-2"
            name="value"
            value={+1}
          >
            +1
          </button>
          <div>Count: {count2}</div>
        </form>
      </div>
      <div className="border-t"></div>
      <div className="flex flex-col gap-2 p-2">
        <h4>"use server" file + client component</h4>
        <Counter3 />
      </div>
      <div className="border-t"></div>
      <div className="flex flex-col gap-2 p-2">
        <h4>"use server" closure (FunctionDeclaration)</h4>
        <Counter4 />
      </div>
      <div className="border-t"></div>
      <div className="flex flex-col gap-2 p-2">
        <h4>"use server" closure (ArrowFunctionExpression)</h4>
        <Counter5 />
      </div>
    </div>
  );
}

let count2 = 0;

async function changeCount2(formData: FormData) {
  "use server";
  count2 += Number(formData.get("value"));
}

let count4 = 0;

function Counter4() {
  const name = "value".slice();

  async function changeCount4(formData: FormData) {
    "use server";
    count4 += Number(formData.get(name));
  }

  return (
    <form
      action={changeCount4}
      data-testid="counter4"
      className="flex items-center gap-2"
    >
      <button
        className="antd-btn antd-btn-default px-2"
        name="value"
        value={-1}
      >
        -1
      </button>
      <button
        className="antd-btn antd-btn-default px-2"
        name="value"
        value={+1}
      >
        +1
      </button>
      <div>Count: {count4}</div>
    </form>
  );
}

let count5 = 0;

function Counter5() {
  const name = "value".slice();

  return (
    <form
      className="flex items-center gap-2"
      data-testid="counter5"
      action={(formData: FormData) => {
        "use server";
        count5 += Number(formData.get(name));
      }}
    >
      <button className="antd-btn antd-btn-default px-2" name={name} value={-1}>
        -1
      </button>
      <button className="antd-btn antd-btn-default px-2" name={name} value={+1}>
        +1
      </button>
      <div>Count: {count5}</div>
    </form>
  );
}
