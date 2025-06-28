export function TestUseCache() {
  return (
    <div>
      <form
        action={async (formData) => {
          "use server";
          // TODO: "use server" and "use cache" together breaks?
          const arg = formData.get("arg");
          console.log("[testFn:before]", { arg });
          const result = await testFn(arg);
          console.log("[testFn:after]", { result });
        }}
      >
        <button>[test-use-cache]</button>
        <input className="w-20" name="arg" placeholder="arg" />
      </form>
    </div>
  );
}

async function testFn(...args: unknown[]) {
  "use cache";
  console.log("[testFn]", args);
  return args;
}
