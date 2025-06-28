export function TestUseCache() {
  return (
    <div>
      <form
        data-testid="test-use-cache-fn"
        action={async (formData) => {
          "use server";
          actionCount++;
          await testFn(formData.get("argument"));
        }}
      >
        <button>[test-use-cache-fn]</button>
        <input className="w-25" name="argument" placeholder="argument" />
        <span>
          (actionCount: {actionCount}, cacheFnCount: {cacheFnCount})
        </span>
      </form>
      <TestComponent>
        {/*
          NOTE: warpping with `span` is crucial because
          raw string `children` would get included as cache key
          and thus causes `TestComponent` to be evaluated in each render.
        */}
        <span>{new Date().toISOString()}</span>
      </TestComponent>
    </div>
  );
}

let actionCount = 0;
let cacheFnCount = 0;

async function testFn(..._args: unknown[]) {
  "use cache";
  cacheFnCount++;
}

async function TestComponent(props: { children?: React.ReactNode }) {
  "use cache";
  return (
    <div data-testid="test-use-cache-component">
      [test-use-cache-component]{" "}
      <span data-testid="test-use-cache-component-static">
        (static: {new Date().toISOString()})
      </span>{" "}
      <span data-testid="test-use-cache-component-dynamic">
        (dynamic: {props.children})
      </span>
    </div>
  );
}
