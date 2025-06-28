export function TestUseCache() {
  return (
    <div>
      <form
        action={async (formData) => {
          "use server";
          await testFn(formData.get("argument"));
        }}
      >
        <button>[test-use-cache-fn]</button>
        <input className="w-25" name="argument" placeholder="argument" />
        (testFnCount: {testFnCount})
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

let testFnCount = 0;

async function testFn(..._args: unknown[]) {
  "use cache";
  testFnCount++;
}

async function TestComponent(props: { children?: React.ReactNode }) {
  "use cache";
  return (
    <div>
      [test-use-cache-component] (static: {new Date().toISOString()}) (dynamic:{" "}
      {props.children})
    </div>
  );
}
