import JsxInJsInDep from "@hiogawa/test-deps-jsx-in-js";
import JsxInJsServer from "./_jsx-in.js";
import JsxInJsClient from "./_jsx-in-client.js";

export default function Page() {
  return (
    <div
      data-testid="jsx-in-js"
      style={{
        margin: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <h4>Test JSX in .js</h4>
      <div>
        [server (node_modules): <JsxInJsInDep />]
      </div>
      <div>
        [server (user code): <JsxInJsServer />]
      </div>
      <div>
        [client (user code): <JsxInJsClient />]
      </div>
    </div>
  );
}
