import { type Page, expect, test } from "@playwright/test";
import {
  checkNoError,
  editFile,
  getClientManifest,
  inspectDevModules,
  setupCheckClientState,
  testNoJs,
  waitForHydration,
} from "./helper";

test("basic", async ({ page }) => {
  checkNoError(page);

  const res = await page.goto("/test");
  expect(res?.status()).toBe(200);

  await waitForHydration(page);
});

test("navigation", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await page.getByRole("link", { name: "/test/other" }).click();
  await page.getByText("Other Page").click();
  await page.waitForURL("/test/other");
  await page.goBack();
  await page.waitForURL("/test");

  await checkClientState();
});

test("render count", async ({ page }) => {
  await page.goto("/test");
  await waitForHydration(page);

  // no strict mode double effect since canary 20240408 ?
  const count = process.env.E2E_PREVIEW ? 1 : 1;
  await page.getByText(`[effect: ${count}]`).click();
  await page.getByRole("link", { name: "/test/other" }).click();
  await page.getByText(`[effect: ${count}]`).click();
  await page.goBack();
  await page.getByText(`[effect: ${count}]`).click();
});

async function checkTransitionState(
  page: Page,
  isPending: boolean,
  isActionPending: boolean,
) {
  await expect(page.getByTestId("transition")).toHaveAttribute(
    "data-test-transition",
    `{"isPending":${isPending},"isActionPending":${isActionPending}}`,
  );
}

test("ServerTransitionContext.isPending", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/transition");
  await waitForHydration(page);

  await expect(page.getByRole("link", { name: "About" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("link", { name: "Posts (2.0 sec)" }),
  ).toHaveAttribute("aria-selected", "false");

  await page.getByText("Took 0 sec to load.").click();

  // start transition
  await checkTransitionState(page, false, false);
  await page.getByRole("link", { name: "Posts (2.0 sec)" }).click();
  await checkTransitionState(page, true, false);
  await expect(page.getByRole("link", { name: "About" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await expect(
    page.getByRole("link", { name: "Posts (2.0 sec)" }),
  ).toHaveAttribute("aria-selected", "true");

  // finished
  await checkTransitionState(page, false, false);
  await page.getByText("Took 2 sec to load.").click();
});

test("ServerTransitionContext.isActionPending", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/action");
  await waitForHydration(page);

  // start transition
  await checkTransitionState(page, false, false);
  await page.getByRole("button", { name: "2.0 sec" }).click();
  await checkTransitionState(page, false, true);

  // finished
  await checkTransitionState(page, false, false);
});

test("Link modifier", async ({ page, context }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  const newPagePromise = context.waitForEvent("page");
  await page.getByRole("link", { name: "/test/other" }).click({
    modifiers: ["Control"],
  });
  const newPage = await newPagePromise;
  await newPage.waitForURL("/test/other");
  await page.waitForURL("/test");
});

test("Link onClick merge", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/other");
  await waitForHydration(page);
  await page.getByText("Count: 0").click();
  await page.getByRole("link", { name: "LinkOnClickMerge" }).click();
  await page.getByText("Count: 1").click();
  await page.waitForURL("/test/other?count");
});

test("error", async ({ page }) => {
  const res = await page.goto("/test/error-not-found");
  expect(res?.status()).toBe(404);

  await waitForHydration(page);
  await page.getByText(`NotFoundPage`).click();

  const checkClientState = await setupCheckClientState(page);

  await page.getByRole("link", { name: "/test/error" }).click();
  await page.getByRole("link", { name: "/test/error/server?500" }).click();
  await page.getByText('server error: {"status":500}').click();

  await page.getByRole("link", { name: "/test/error" }).click();
  await page.getByRole("link", { name: "/test/error/server?custom" }).click();
  await page
    .getByText('server error: {"status":403,"customMessage":"hello"}')
    .click();

  await page.getByRole("link", { name: "/test/error" }).click();
  await page.getByRole("link", { name: "/test/error/browser" }).click();
  await page.getByText("server error: (N/A)").click();

  // wrong usage errors would brew away the whole app on build?
  if (!process.env.E2E_PREVIEW) {
    await page.getByRole("link", { name: "/test/error" }).click();
    await page.getByRole("link", { name: "/test/error/use-client" }).click();
    await page.getByText('server error: {"status":500}').click();

    await page.getByRole("link", { name: "/test/error" }).click();
    await page.getByRole("link", { name: "/test/error/use-server" }).click();
    await page.getByText('server error: {"status":500}').click();
  }

  await page.getByRole("link", { name: "/test/other" }).click();
  await page.getByRole("heading", { name: "Other Page" }).click();

  await checkClientState();
});

test("error boundary @js", async ({ page }) => {
  await page.goto("/test/error/boundary");
  await waitForHydration(page);
  await page.getByText("boundary/page.tsx").click();

  await page
    .getByRole("link", { name: "• /test/error/boundary/dir/redirect" })
    .click();
  await page.getByText("boundary/dir/[id]/page.tsx").click();
  await page.getByText('{"id":"ok"}').click();

  await page
    .getByRole("link", { name: "• /test/error/boundary/dir/not-found" })
    .click();
  await page.getByText("boundary/not-found.tsx").click();

  await page
    .getByRole("link", { name: "• /test/error/boundary/dir/unexpected" })
    .click();
  await page.getByText("boundary/dir/error.tsx").click();

  await page
    .getByRole("link", { name: "• /test/error/boundary/dir", exact: true })
    .click();
  await page.getByText("boundary/dir/page.tsx").click();
});

testNoJs("error boundary @nojs", async ({ page }) => {
  await page.goto("/test/error/boundary");
  await page.getByText("boundary/page.tsx").click();

  // redirect error works
  await page
    .getByRole("link", { name: "• /test/error/boundary/dir/redirect" })
    .click();
  await page.getByText("boundary/dir/[id]/page.tsx").click();
  await page.getByText('{"id":"ok"}').click();

  // other errors don't work
  {
    await page.goto("/test/error/boundary");
    const repsonsePromise = page.waitForResponse(
      "/test/error/boundary/dir/not-found",
    );
    await page
      .getByRole("link", { name: "• /test/error/boundary/dir/not-found" })
      .click();
    const response = await repsonsePromise;
    expect(response.status()).toBe(404);
  }

  {
    await page.goto("/test/error/boundary");
    const repsonsePromise = page.waitForResponse(
      "/test/error/boundary/dir/unexpected",
    );
    await page
      .getByRole("link", { name: "• /test/error/boundary/dir/unexpected" })
      .click();
    const response = await repsonsePromise;
    expect(response.status()).toBe(500);
  }
});

testNoJs("ssr not-found @nojs", async ({ page }) => {
  await page.goto("/test/error/not-found");
  await page.getByText(`NotFoundPage`).click();
});

test("default not-found page", async ({ page }) => {
  const res = await page.goto("/not-found");
  expect(res?.status()).toBe(404);
  await page.getByText("404 Not Found").click();
});

test("rsc hmr @dev", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await page.getByRole("heading", { name: "RSC Experiment" }).click();
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await editFile("./src/components/header.tsx", (s) =>
    s.replace("RSC Experiment", "RSC (EDIT) Experiment"),
  );
  await page.getByRole("heading", { name: "RSC (EDIT) Experiment" }).click();
  await waitForHydration(page);

  await checkClientState();

  const res = await page.reload();
  await waitForHydration(page);
  const resText = await res?.text();
  expect(resText).toContain("RSC (EDIT) Experiment");
});

test("common hmr @dev", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await page.getByText("Common component (from server)").click();
  await page.getByText("Common component (from client)").click();
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await editFile("./src/components/common.tsx", (s) =>
    s.replace("Common component", "Common (EDIT) component"),
  );
  await page.getByText("Common (EDIT) component (from server)").click();
  await page.getByText("Common (EDIT) component (from client)").click();
  await waitForHydration(page);

  await checkClientState();

  const res = await page.reload();
  await waitForHydration(page);
  const resText = await res?.text();
  expect(resText).toContain(
    "Common (EDIT) component (<!-- -->from server<!-- -->)",
  );
  expect(resText).toContain(
    "Common (EDIT) component (<!-- -->from client<!-- -->)",
  );
});

test("client hmr @dev", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  // modify client comopnent
  await page.getByText("test-hmr-div").click();
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-div", "test-hmr-edit-div"),
  );
  await page.getByText("test-hmr-edit-div").click();

  await checkClientState();

  // SSR should also use a fresh module
  const res = await page.reload();
  await waitForHydration(page);
  const resText = await res?.text();
  expect(resText).toContain("<div>test-hmr-edit-div</div>");
});

test("rsc + client + rsc hmr @dev", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  await page.getByText("Count: 0").click();
  await page.getByRole("button", { name: "+" }).click();
  await page.getByText("Count: 1").click();

  // edit server
  await editFile("./src/routes/test/page.tsx", (s) =>
    s.replace("Server Time", "Server (EDIT 1) Time"),
  );
  await page.getByText("Server (EDIT 1) Time").click();
  await page.getByText("Count: 1").click();

  // edit client
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-div", "test-hmr-edit1-div"),
  );
  await page.getByText("test-hmr-edit1-div").click();
  await page.getByText("Count: 1").click();

  // edit server again
  await editFile("./src/routes/test/page.tsx", (s) =>
    s.replace("Server (EDIT 1) Time", "Server (EDIT 2) Time"),
  );
  await page.getByText("Server (EDIT 2) Time").click();
  await page.getByText("Count: 1").click();

  // edit client again
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-edit1-div", "test-hmr-edit2-div"),
  );
  await page.getByText("test-hmr-edit2-div").click();
  await page.getByText("Count: 1").click();

  // check no hydration error after reload
  await page.reload();
  await waitForHydration(page);
});

test.skip("module invalidation @dev", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  const moduleUrls = [
    "/src/adapters/node.ts",
    "/src/entry-server",
    "/src/routes/test/page",
    "/src/components/counter",
    "@hiogawa/react-server/entry/ssr",
    "@hiogawa/react-server/entry/server",
  ] as const;

  const result = await inspectDevModules(page, moduleUrls);
  expect(result).toMatchObject({
    "/src/adapters/node.ts": {
      ssr: expect.any(Object),
      "react-server": false,
    },
    "/src/entry-server": {
      ssr: false,
      "react-server": expect.any(Object),
    },
    "/src/routes/test/page": {
      ssr: false,
      "react-server": expect.any(Object),
    },
    "/src/components/counter": {
      ssr: expect.any(Object),
      "react-server": expect.any(Object),
    },
    "@hiogawa/react-server/entry/ssr": {
      ssr: expect.any(Object),
      "react-server": false,
    },
    "@hiogawa/react-server/entry/server": {
      ssr: false,
      "react-server": expect.any(Object),
    },
  });

  // each render doesn't invalidate anything
  await page.reload();
  await waitForHydration(page);

  const result2 = await inspectDevModules(page, moduleUrls);
  expect([
    result["/src/adapters/node.ts"].ssr.lastInvalidationTimestamp,
    result["/src/entry-server"]["react-server"].lastInvalidationTimestamp,
  ]).toEqual([
    result2["/src/adapters/node.ts"].ssr.lastInvalidationTimestamp,
    result2["/src/entry-server"]["react-server"].lastInvalidationTimestamp,
  ]);

  // updating client component invalidates react-server entry
  // due to import.meta.glob dependency
  //   react server entry -> page -> client reference
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-div", "test-hmr-edit-div"),
  );
  await page.getByText("test-hmr-edit-div").click();

  const result3 = await inspectDevModules(page, moduleUrls);
  expect([
    result["/src/adapters/node.ts"].ssr.lastInvalidationTimestamp,
  ]).toEqual([result3["/src/adapters/node.ts"].ssr.lastInvalidationTimestamp]);

  const changed = [
    ["/src/entry-server", "react-server"],
    ["/src/routes/test/page", "react-server"],
    ["/src/components/counter", "react-server"],
    ["/src/components/counter", "ssr"],
  ];
  for (const [k1, k2] of changed) {
    const v2 = (result2 as any)[k1][k2].lastInvalidationTimestamp;
    const v3 = (result3 as any)[k1][k2].lastInvalidationTimestamp;
    expect(v3).toBeGreaterThan(v2);
  }
});

test("unocss", async ({ page, browser }) => {
  checkNoError(page);

  await page.goto("/test");
  await expect(page.getByRole("heading", { name: "RSC Experiment" })).toHaveCSS(
    "font-weight",
    "700",
  );

  const page2 = await browser.newPage({ javaScriptEnabled: false });
  await page2.goto("/test");
  await expect(
    page2.getByRole("heading", { name: "RSC Experiment" }),
  ).toHaveCSS("font-weight", "700");
});

test("unocss hmr @dev", async ({ page, browser }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await expect(page.getByRole("heading", { name: "RSC Experiment" })).toHaveCSS(
    "font-weight",
    "700",
  );
  await editFile("./src/components/header.tsx", (s) =>
    s.replace("font-bold", "font-light"),
  );
  await expect(page.getByRole("heading", { name: "RSC Experiment" })).toHaveCSS(
    "font-weight",
    "300",
  );

  await checkClientState();

  // verify new style is applied without js
  const page2 = await browser.newPage({ javaScriptEnabled: false });
  await page2.goto("/test");
  await expect(
    page2.getByRole("heading", { name: "RSC Experiment" }),
  ).toHaveCSS("font-weight", "300");
});

test("react-server css @js", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/css");
  await expect(page.getByText("css normal")).toHaveCSS(
    "background-color",
    "rgb(250, 250, 200)",
  );
  await expect(page.getByText("css module")).toHaveCSS(
    "background-color",
    "rgb(200, 250, 250)",
  );
});

testNoJs("react-server css @nojs", async ({ page }) => {
  await page.goto("/test/css");
  await expect(page.getByText("css normal")).toHaveCSS(
    "background-color",
    "rgb(250, 250, 200)",
  );
  await expect(page.getByText("css module")).toHaveCSS(
    "background-color",
    "rgb(200, 250, 250)",
  );
});

test("react-server css hmr @dev", async ({ page, browser }) => {
  checkNoError(page);

  await page.goto("/test/css");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await expect(page.getByText("css normal")).toHaveCSS(
    "background-color",
    "rgb(250, 250, 200)",
  );
  await editFile("./src/routes/test/css/css-normal.css", (s) =>
    s.replace("rgb(250, 250, 200)", "rgb(250, 250, 123)"),
  );
  await expect(page.getByText("css normal")).toHaveCSS(
    "background-color",
    "rgb(250, 250, 123)",
  );

  await expect(page.getByText("css module")).toHaveCSS(
    "background-color",
    "rgb(200, 250, 250)",
  );
  await editFile("./src/routes/test/css/css-module.module.css", (s) =>
    s.replace("rgb(200, 250, 250)", "rgb(123, 250, 250)"),
  );
  await expect(page.getByText("css module")).toHaveCSS(
    "background-color",
    "rgb(123, 250, 250)",
  );

  await checkClientState();

  // verify new style is applied without js
  {
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.goto("/test/css");
    await expect(page.getByText("css normal")).toHaveCSS(
      "background-color",
      "rgb(250, 250, 123)",
    );
    await expect(page.getByText("css module")).toHaveCSS(
      "background-color",
      "rgb(123, 250, 250)",
    );
  }
});

test("client css @js", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/css");
  await expect(page.getByText("css client normal")).toHaveCSS(
    "background-color",
    "rgb(250, 250, 200)",
  );
  await expect(page.getByText("css client module")).toHaveCSS(
    "background-color",
    "rgb(200, 250, 250)",
  );
});

testNoJs("client css @nojs", async ({ page }) => {
  await page.goto("/test/css");
  await expect(page.getByText("css client normal")).toHaveCSS(
    "background-color",
    "rgb(250, 250, 200)",
  );
  await expect(page.getByText("css client module")).toHaveCSS(
    "background-color",
    "rgb(200, 250, 250)",
  );
});

test("client css hmr @dev", async ({ page, browser }) => {
  checkNoError(page);

  await page.goto("/test/css");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await expect(page.getByText("css client normal")).toHaveCSS(
    "background-color",
    "rgb(250, 250, 200)",
  );
  await editFile("./src/routes/test/css/css-client-normal.css", (s) =>
    s.replace("rgb(250, 250, 200)", "rgb(250, 250, 123)"),
  );
  await expect(page.getByText("css client normal")).toHaveCSS(
    "background-color",
    "rgb(250, 250, 123)",
  );

  await checkClientState();

  // verify new style is applied without js
  {
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.goto("/test/css");
    await expect(page.getByText("css client normal")).toHaveCSS(
      "background-color",
      "rgb(250, 250, 123)",
    );
  }
});

test("client css module hmr @dev", async ({ page, browser }) => {
  checkNoError(page);

  await page.goto("/test/css");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await expect(page.getByText("css client module")).toHaveCSS(
    "background-color",
    "rgb(200, 250, 250)",
  );
  await editFile("./src/routes/test/css/css-client-module.module.css", (s) =>
    s.replace("rgb(200, 250, 250)", "rgb(123, 250, 250)"),
  );
  await expect(page.getByText("css client module")).toHaveCSS(
    "background-color",
    "rgb(123, 250, 250)",
  );

  await checkClientState();

  // verify new style is applied without js
  {
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.goto("/test/css");
    await expect(page.getByText("css client module")).toHaveCSS(
      "background-color",
      "rgb(123, 250, 250)",
    );
  }
});

testNoJs("useServerInsertedHTML @nojs", async ({ page }) => {
  await page.goto("/test/css/in-js");
  await expect(page.getByText("CSS in JS")).toHaveCSS(
    "background-color",
    "rgb(250, 220, 220)",
  );
});

test("server action @js", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  // on client render, the form doesn't have hidden $ACTION_ID_...
  await page.getByRole("link", { name: "/test/action/extra" }).nth(0).click();
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);
  await testServerAction(page, "counter1");
  await testServerAction(page, "counter2");
  await testServerAction(page, "counter3");
  await testServerAction(page, "counter4");
  await testServerAction(page, "counter5");
  await checkClientState();

  // check layout doesn't re-render
  const count = process.env.E2E_PREVIEW ? 1 : 1;
  await page.getByText(`[effect: ${count}]`).click();
});

testNoJs("server action @nojs", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/action/extra");
  await testServerAction(page, "counter1");
  await testServerAction(page, "counter2");
  await testServerAction(page, "counter3");
  await testServerAction(page, "counter4");
  await testServerAction(page, "counter5");
});

async function testServerAction(page: Page, testId: string) {
  await page.getByTestId(testId).getByText("Count: 0").click();
  await page.getByTestId(testId).getByRole("button", { name: "+" }).click();
  await page.getByTestId(testId).getByText("Count: 1").click();
  await page.getByTestId(testId).getByRole("button", { name: "-" }).click();
  await page.getByTestId(testId).getByText("Count: 0").click();
}

test("server action and useOptimistic @js", async ({ page }) => {
  await page.goto("/test/action");
  await waitForHydration(page);
  await testServerActionOptimistic(page, { js: true });
});

testNoJs("server action and useOptimistic @nojs", async ({ page }) => {
  await page.goto("/test/action");
  await testServerActionOptimistic(page, { js: false });
});

async function testServerActionOptimistic(
  page: Page,
  options: { js: boolean },
) {
  await page.getByPlaceholder("write something...").fill("first");
  await page.getByPlaceholder("write something...").press("Enter");
  if (options.js) {
    await page.getByText("[?] first").click(); // optimistic state
  }
  await page.getByText("[1] first").click();
  await expect(page.getByPlaceholder("write something...")).toHaveValue(""); // auto reset
  await page.getByText("[1] first").click();
  await page.getByPlaceholder("write something...").fill("second");
  await page.getByPlaceholder("write something...").press("Enter");
  await page.getByText("[2] second").click();
  await page.getByRole("button", { name: "Clear" }).click();
}

test("ReactDom.useFormStatus", async ({ page }) => {
  await page.goto("/test/action");
  await waitForHydration(page);
  await page.getByRole("button", { name: "1.0 sec" }).click();
  await page.getByText("pending: true").click();
  await page.getByText("pending: false").click();
});

test("action returning component", async ({ page }) => {
  await page.goto("/test/action");
  await waitForHydration(page);
  await page
    .getByTestId("action-return-component")
    .getByRole("button", { name: "Action" })
    .click();
  await page.getByText("[server] Loading...").click();
  await page.getByRole("button", { name: "[client] counter: 0" }).click();
  await page.getByRole("button", { name: "[client] counter: 1" }).click();
  await page.getByText("[server] OK!").click();
});

test("higher order action @js", async ({ page }) => {
  await page.goto("/test/action");
  await waitForHydration(page);
  await testHigherOrderAction(page);
});

testNoJs("higher order action @nojs", async ({ page }) => {
  await page.goto("/test/action");
  await testHigherOrderAction(page);
});

async function testHigherOrderAction(page: Page) {
  await expect(page.getByTestId("higher-order-result")).toHaveText("(none)");
  await page.getByRole("button", { name: "Higher Order" }).click();
  await expect(page.getByTestId("higher-order-result")).toHaveText("ok");
  await page.getByRole("button", { name: "Higher Order" }).click();
  await expect(page.getByTestId("higher-order-result")).toHaveText("(none)");
}

test("action error caught by try/catch", async ({ page }) => {
  await page.goto("/test/action");
  await waitForHydration(page);
  await expect(page.getByTestId("action-error-result")).toHaveText(
    "Result: (none)",
  );
  await page.getByRole("button", { name: "TestActionErrorTryCatch" }).click();
  await expect(page.getByTestId("action-error-result")).toContainText(
    "Result: Error: ReactServerError",
  );
});

test("action error triggers boundary", async ({ page }) => {
  await page.goto("/test/action");
  await waitForHydration(page);
  await page.getByRole("button", { name: "TestActionErrorBoundary" }).click();
  await page.getByRole("heading", { name: "ErrorPage" }).click();
  await page.getByText('server error: {"status":500}').click();
});

test("use client > virtual module", async ({ page }) => {
  await page.goto("/test/deps");
  await page.getByText("TestVirtualUseClient").click();
});

test("use client > fixture", async ({ page }) => {
  await page.goto("/test/deps");
  await page.getByText("TestDepUseClient").click();
});

test("use client > react-wrap-balancer", async ({ page }) => {
  await page.goto("/test/deps");
  await page.getByText("BalancerNamed").click();
  await page.getByText("BalancerDefault").click();
});

test("server compnoent > fixture", async ({ page }) => {
  await page.goto("/test/deps");
  await page.getByText("TestDepServerComponent").click();
});

test("server-client-mixed package", async ({ page }) => {
  await page.goto("/test/deps");
  await page.getByText("TestDepMixed(Server)").click();
  await waitForHydration(page);
  await page.getByRole("button", { name: "TestDepMixed(Client): 0" }).click();
  await page.getByRole("button", { name: "TestDepMixed(Client): 1" }).click();
});

test("tolerate export all with use client", async ({ page }) => {
  await page.goto("/test/deps");
  await waitForHydration(page);
  await page
    .getByRole("button", { name: "TestDepReExportExplicit: 0" })
    .click();
  await page
    .getByRole("button", { name: "TestDepReExportExplicit: 1" })
    .click();
});

test("client module used at boundary and non-boundary basic", async ({
  page,
}) => {
  await page.goto("/test/deps");
  await page.getByText("Client2Context [ok]").click();
});

test("client module used at boundary and non-boundary hmr @dev", async ({
  page,
}) => {
  await page.goto("/test/deps");
  await page.getByText("Client2Context [ok]").click();

  await waitForHydration(page);

  await editFile("./src/routes/test/deps/_client2.tsx", (s) =>
    s.replace(`value="ok"`, `value="okok"`),
  );
  await page.getByText("Client2Context [okok]").click();

  await page.reload();
  await waitForHydration(page);
  await page.getByText("Client2Context [okok]").click();
});

test("RouteProps.request", async ({ page }) => {
  await page.goto("/test/other");
  await waitForHydration(page);
  await page.getByText("searchParams = {}").click();
  await page.getByRole("link", { name: "hello" }).click();
  await page.getByText('searchParams = {"hello":""}').click();
});

test("custom entry-server", async ({ request }) => {
  const res = await request.get("/test/__rpc");
  expect(await res.json()).toEqual({ hello: "world" });
});

test("head in rsc", async ({ page }) => {
  await page.goto("/test/head");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await page.getByRole("link", { name: "title = hello" }).click();
  await expect(page).toHaveTitle("hello");
  await page.getByRole("link", { name: "title = world" }).click();
  await expect(page).toHaveTitle("world");

  await checkClientState();

  // TODO: it doesn't magically overwrite already rendered title in the layout...
  const res = await page.request.get("/test/head?title=hello");
  const resText = await res.text();
  expect(resText).toMatch(/<head>.*<title>rsc-experiment<\/title>.*<\/head>/s);
  expect(resText).toMatch(/<head>.*<title>hello<\/title>.*<\/head>/s);
  expect(resText).toMatch(
    /<head>.*<meta name="test" content="hello"\/>.*<\/head>/s,
  );
});

testNoJs("redirect server component @nojs", async ({ page }) => {
  checkNoError(page);

  const res = await page.request.get("/test/redirect?from-server-component", {
    maxRedirects: 0,
  });
  expect(res.status()).toBe(302);
  expect(res.headers()).toMatchObject({
    location: "/test/redirect?ok=server-component",
  });
  expect(await res.text()).toBe("");

  await page.goto("/test/redirect");
  await page.getByRole("link", { name: "Server Component" }).click();
  await page.getByText("ok=server-component").click();
  await page.waitForURL("/test/redirect?ok=server-component");
});

test("redirect server component @js", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/redirect");
  await waitForHydration(page);
  await page.getByRole("link", { name: "Server Component" }).click();
  await page.getByText("ok=server-component").click();
  await page.waitForURL("/test/redirect?ok=server-component");
});

testNoJs("redirect server action @nojs", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/redirect");
  await page.getByRole("button", { name: "Action" }).click();
  await page.getByText("ok=server-action").click();
  await page.waitForURL("/test/redirect?ok=server-action");
});

test("redirect server action @js", async ({ page }) => {
  await page.goto("/test/redirect");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Action" }).click();
  await page.waitForURL("/test/redirect?ok=server-action");
});

test("redirect suspense @js", async ({ page }) => {
  await page.goto("/test/redirect");
  await waitForHydration(page);
  await page.getByRole("link", { name: "Suspense" }).click();
  await page.getByText("fallback until redirect...").click();
  await page.getByText("ok=suspense").click();
  await page.waitForURL("/test/redirect?ok=suspense");
});

test("useActionState @js", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/action");
  await waitForHydration(page);
  await testUseActionState(page, { js: true });
});

testNoJs("useActionState @nojs", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/action");
  await testUseActionState(page, { js: false });
});

async function testUseActionState(page: Page, options: { js: boolean }) {
  await page.getByPlaceholder("Answer?").fill("3");
  await page.getByPlaceholder("Answer?").press("Enter");
  if (options.js) {
    await expect(page.getByTestId("action-state")).toHaveText("...");
  }
  await page.getByText("Wrong! (tried once)").click();
  await expect(page.getByPlaceholder("Answer?")).toHaveValue("3");

  await page.getByPlaceholder("Answer?").fill("2");
  await page.getByPlaceholder("Answer?").press("Enter");
  await page.getByText("Correct! (tried 2 times)").click();
}

test("non-form aciton", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/action");
  await waitForHydration(page);
  await page.getByPlaceholder("Number...").fill("1");
  await page.getByPlaceholder("Number...").press("Enter");
  await expect(page.getByTestId("non-form-action-state")).toHaveText("...");
  await expect(page.getByTestId("non-form-action-state")).toHaveText("1");
  await page.getByPlaceholder("Number...").fill("-1");
  await page.getByPlaceholder("Number...").press("Enter");
  await expect(page.getByTestId("non-form-action-state")).toHaveText("0");
});

test("action bind @js", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/action");
  await waitForHydration(page);
  await testActionBind(page);
});

testNoJs("action bind @nojs", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/action");
  await testActionBind(page);
});

async function testActionBind(page: Page) {
  await page.getByRole("button", { name: "Action Bind Test (server)" }).click();
  await expect(page.getByTestId("action-bind")).toContainText("server-bind");
  await page.getByRole("button", { name: "Action Bind Test (client)" }).click();
  await expect(page.getByTestId("action-bind")).toContainText("client-bind");
}

test("action context @js", async ({ page }) => {
  await page.goto("/test/session");
  await waitForHydration(page);
  await testActionContext(page);
});

testNoJs("action context @nojs", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/session");
  await testActionContext(page);
});

async function testActionContext(page: Page) {
  // redirected from auth protected action
  await page.getByText("Hi, anonymous user!").click();
  await page.getByRole("button", { name: "+1" }).click();
  await page.waitForURL("/test/session/signin");

  // signin
  await page.getByPlaceholder("Input name...").fill("asdf");
  await page.getByRole("button", { name: "Signin" }).click();
  await page.waitForURL("/test/session");

  // try auth protected action
  await page.getByText("Hello, asdf!").click();
  await page.getByText("Counter: 0").click();
  await page.getByRole("button", { name: "+1" }).click();
  await page.getByText("Counter: 1").click();
  await page.getByRole("button", { name: "-1" }).click();
  await page.getByText("Counter: 0").click();

  // signout
  await page.getByRole("button", { name: "Signout" }).click();
  await page.getByText("Hi, anonymous user!").click();
}

test("revalidate on action", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/revalidate");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  const count = process.env.E2E_PREVIEW ? 1 : 1;
  await page.getByText(`[effect: ${count}]`).click();
  await page.getByRole("button", { name: "Action" }).click();
  await page.getByText(`[effect: ${count + 1}]`).click();

  await checkClientState();
});

test("revalidate on navigation", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/revalidate");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  const count = process.env.E2E_PREVIEW ? 1 : 1;
  await page.getByText(`[effect: ${count}]`).click();
  await page.getByRole("link", { name: "Navigation" }).click();
  await page.getByText(`[effect: ${count + 1}]`).click();

  await page.getByPlaceholder("Search...").fill("world");
  await page.getByPlaceholder("Search...").press("Enter");
  await page.getByText(`[effect: ${count + 2}]`).click();
  await page.waitForURL("/test/revalidate?q=world");

  await checkClientState();
});

test("revalidate by path on action", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/revalidate/x");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  const count = process.env.E2E_PREVIEW ? 1 : 1;
  await page.getByText(`[effect: ${count}]`).click();
  await page.getByText(`[effect-revalidate: ${count}]`).click();
  await page
    .getByRole("button", { name: 'action revalidate "/test/revalidate"' })
    .click();
  await page.getByText(`[effect: ${count}]`).click();
  await page.getByText(`[effect-revalidate: ${count + 1}]`).click();

  await checkClientState();
});

test("revalidate by path on navigation", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/revalidate/x");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  const count = process.env.E2E_PREVIEW ? 1 : 1;
  await page.getByText(`[effect: ${count}]`).click();
  await page.getByText(`[effect-revalidate: ${count}]`).click();
  await page
    .getByRole("link", { name: 'link revalidate "/test/revalidate"' })
    .click();
  await page.getByText(`[effect: ${count}]`).click();
  await page.getByText(`[effect-revalidate: ${count + 1}]`).click();

  await checkClientState();
});

test("dynamic routes", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/dynamic");
  await waitForHydration(page);

  await page.getByText("file: /test/dynamic/page.tsx").click();
  await page.getByText("pathname: /test/dynamic").click();
  await page.getByText("params: {}").click();

  await page.getByRole("link", { name: "• /test/dynamic/static" }).click();
  await page.getByText("file: /test/dynamic/static/page.tsx").click();
  await page.getByText("pathname: /test/dynamic/static").click();
  await page.getByText("params: {}").click();

  await page
    .getByRole("link", { name: "• /test/dynamic/abc", exact: true })
    .click();
  await page.getByText("file: /test/dynamic/[id]/page.tsx").click();
  await page.getByText("pathname: /test/dynamic/abc").click();
  await page.getByText('params: {"id":"abc"}').click();

  await page.getByRole("link", { name: "• /test/dynamic/abc/def" }).click();
  await page.getByText("file: /test/dynamic/[id]/[nested]/page.tsx").click();
  await page.getByText("pathname: /test/dynamic/abc/def").click();
  await page.getByText("pathname (client): /test/dynamic/abc/def").click();
  await page.getByText("pathname (server): /test/dynamic/abc/def").click();
  await page.getByText('params: {"id":"abc","nested":"def"}').click();

  // regardless of Link.href prop
  // - pathname is always encoded
  // - param is always decoded
  await page.getByRole("link", { name: "/test/dynamic/✅" }).click();
  await page.getByText('params: {"id":"✅"}').click();
  await page.waitForURL("/test/dynamic/✅");
  await expect(
    page.getByRole("link", { name: "/test/dynamic/✅" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("link", { name: "/test/dynamic/%E2%9C%85" }),
  ).toHaveAttribute("aria-current", "page");

  await page.getByRole("link", { name: "/test/dynamic/%E2%9C%85" }).click();
  await page.getByText('params: {"id":"✅"}').click();
  await page.waitForURL("/test/dynamic/✅");
  await expect(
    page.getByRole("link", { name: "/test/dynamic/✅" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("link", { name: "/test/dynamic/%E2%9C%85" }),
  ).toHaveAttribute("aria-current", "page");
});

test("remount on dynamic segment change", async ({ page }) => {
  await page.goto("/test/dynamic/abc");
  await waitForHydration(page);
  await page.getByPlaceholder("dynamic-test").fill("hello");

  // no remount on same segment
  await page.getByRole("link", { name: "• /test/dynamic/abc/def" }).click();
  await page.waitForURL("/test/dynamic/abc/def");
  await page.getByText("pathname: /test/dynamic/abc/def").click();
  await expect(page.getByPlaceholder("dynamic-test")).toHaveValue("hello");

  // remount on new segment
  await page.getByRole("link", { name: "• /test/dynamic/✅" }).click();
  await page.waitForURL("/test/dynamic/✅");
  await expect(page.getByPlaceholder("dynamic-test")).toHaveValue("");
});

test("catch-all routes @js", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/dynamic/catchall");
  await waitForHydration(page);
  await testCatchallRoute(page, { js: true });
});

testNoJs("catch-all routes @nojs", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/dynamic/catchall");
  await testCatchallRoute(page, { js: false });
});

async function testCatchallRoute(page: Page, _options: { js: boolean }) {
  await page
    .getByRole("link", { name: "• /test/dynamic/catchall/static" })
    .click();
  await page.getByText("params: {}").click();
  await page.getByText("file: /test/dynamic/catchall/").click();

  await page
    .getByRole("link", { name: "• /test/dynamic/catchall/x", exact: true })
    .click();
  await page.getByText('params: {"any":"x"}').click();
  await page.getByText("file: /test/dynamic/catchall").click();
  await page.getByLabel("test state").check();

  await page
    .getByRole("link", { name: "• /test/dynamic/catchall/x/y", exact: true })
    .click();
  await page.getByText("file: /test/dynamic/catchall").click();
  await page.getByText('params: {"any":"x/y"}').click();
  // state is not preserved
  await expect(page.getByLabel("test state")).not.toBeChecked();

  await page
    .getByRole("link", { name: "• /test/dynamic/catchall/x/y/z" })
    .click();
  await page.getByText("file: /test/dynamic/catchall").click();
  await page.getByText('params: {"any":"x/y/z"}').click();
  await page.getByLabel("test state").check();

  await page
    .getByRole("link", { name: "• /test/dynamic/catchall/x/y/w" })
    .click();
  await page.getByText("file: /test/dynamic/catchall").click();
  await page.getByText('params: {"any":"x/y/w"}').click();
  // state is not preserved
  await expect(page.getByLabel("test state")).not.toBeChecked();
}

test("optional catch-all", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/catchall-opt");
  await page.getByText('{"slug":""}').click();
  await page
    .getByRole("link", { name: "• /test/catchall-opt/x", exact: true })
    .click();
  await page.getByText('{"slug":"x"}').click();
  await page.getByRole("link", { name: "• /test/catchall-opt/x/y" }).click();
  await page.getByText('{"slug":"x/y"}').click();
});

test("useSelectedLayoutSegments", async ({ page }) => {
  await page.goto("/test/dynamic/selected");
  await page.getByText("/layout.tsx: []").click();
  await page.getByText("/page.tsx: []").click();

  await page
    .getByRole("link", { name: "• /test/dynamic/selected/x", exact: true })
    .click();
  await page.getByText('/layout.tsx: ["x"]').click();
  await page.getByText("/[p1]/layout.tsx: []").click();

  await page
    .getByRole("link", { name: "• /test/dynamic/selected/x/y" })
    .click();
  await page.getByText('/layout.tsx: ["x","y"]').click();
  await page.getByText('/[p1]/layout.tsx: ["y"]').click();
  await page.getByText("/[p1]/[p2]/layout.tsx: []").click();

  await page
    .getByRole("link", {
      name: "• /test/dynamic/selected/x/static",
      exact: true,
    })
    .click();
  await page.getByText('/layout.tsx: ["x","static"]').click();
  await page.getByText('/[p1]/layout.tsx: ["static"]').click();

  await page
    .getByRole("link", { name: "• /test/dynamic/selected/x/static/y" })
    .click();
  await page.getByText('/layout.tsx: ["x","static","y"]').click();
  await page.getByText('/[p1]/layout.tsx: ["static","y"]').click();
  await page.getByText('/[p1]/static/layout.tsx: ["y"]').click();
});

test("full client route", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/client/full");
  await page.getByRole("heading", { name: '"use client" layout' }).click();
  await page.getByRole("heading", { name: '"use client" page' }).click();
});

test("preload ssr @build", async ({ request }) => {
  const file = getClientManifest()["virtual:test-use-client"].file;

  const res = await request.get("/test/deps");
  const resText = await res.text();
  expect(resText).toContain(`<link rel="modulepreload" href="/${file}"/>`);
});

test("preload client @build", async ({ page }) => {
  const file = getClientManifest()["virtual:test-use-client"].file;

  await page.goto("/test");
  await waitForHydration(page);
  await expect(page.locator(`link[href="/${file}"]`)).not.toBeAttached();

  // mouse over to /test/deps
  await page
    .getByRole("link", { name: "/test/deps" })
    .dispatchEvent("mouseover");
  await expect(page.locator(`link[href="/${file}"]`)).toBeAttached();
});

test("trailing slash", async ({ request }) => {
  const res = await request.get("/test/?hello", { maxRedirects: 0 });
  expect([res.status(), res.headers()["location"]]).toEqual([
    308,
    "/test?hello",
  ]);
});

test("React.cache @js", async ({ page }) => {
  await testReactCache(page, { js: true });
});

testNoJs("React.cache @nojs", async ({ page }) => {
  await testReactCache(page, { js: false });
});

async function testReactCache(page: Page, options: { js: boolean }) {
  await page.goto("/test/cache");
  await page.getByText("Page: state = 1").click();
  await page.getByText("Inner1: state = 1").click();
  if (options.js) await page.getByText("Inner2: state = 1").click();

  await page.reload();
  await page.getByText("Page: state = 2").click();
  await page.getByText("Inner1: state = 2").click();
  if (options.js) await page.getByText("Inner2: state = 2").click();

  if (options.js) await waitForHydration(page);
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByText("Page: state = 0").click();
  await page.getByText("Inner1: state = 0").click();
  if (options.js) await page.getByText("Inner2: state = 0").click();
}

test("meta @js", async ({ page }) => {
  await page.goto("/test");
  await waitForHydration(page);
  await testMetadata(page);
});

testNoJs("meta @nojs", async ({ page }) => {
  await page.goto("/test");
  await testMetadata(page);
});

async function testMetadata(page: Page) {
  await expect(page).toHaveTitle("rsc-experiment");

  await page.getByRole("link", { name: "/test/other" }).click();
  await expect(page).toHaveTitle("rsc-experiment");

  await page.getByRole("link", { name: "/test/metadata" }).click();
  await expect(page).toHaveTitle("test-metadata");
}

test("loading @js", async ({ page }) => {
  await page.goto("/test/loading");
  await waitForHydration(page);
  await page.getByRole("link", { name: "• /test/loading/1" }).click();
  await expect(page.getByTestId("/test/loading")).toBeVisible();
  await page.getByText('params {"id":"1"}').click();
  await page.getByRole("link", { name: "• /test/loading/2" }).click();
  await expect(page.getByTestId("/test/loading")).toBeVisible();
  await page.getByText('params {"id":"2"}').click();

  // ssr
  await page.goto("/test/loading/1", { waitUntil: "commit" });
  await expect(page.getByTestId("/test/loading")).toBeVisible();
  await page.getByText('params {"id":"1"}').click();
});

test("template @js", async ({ page }) => {
  await page.goto("/test/template");
  await page.getByText("template.tsx [mount: 1]").click();
  await waitForHydration(page);

  await page
    .getByRole("link", { name: "• /test/template/x", exact: true })
    .click();
  await page.getByText("template.tsx [mount: 2]").click();
  await page.getByText("[p1]/template.tsx [mount: 1]").click();

  await page.getByRole("link", { name: "• /test/template/x/a" }).click();
  await page.getByText("template.tsx [mount: 2]", { exact: true }).click();
  await page.getByText("[p1]/template.tsx [mount: 2]").click();

  await page.getByRole("link", { name: "• /test/template/x/b" }).click();
  await page.getByText("template.tsx [mount: 2]", { exact: true }).click();
  await page.getByText("[p1]/template.tsx [mount: 3]").click();

  await page
    .getByRole("link", { name: "• /test/template/y", exact: true })
    .click();
  await page.getByText("template.tsx [mount: 3]").click();
  await page.getByText("[p1]/template.tsx [mount: 4]").click();
});

test("server assses", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/assets");
  await expect(page.getByTestId("js-import")).toHaveScreenshot();
  await expect(page.getByTestId("css-url")).toHaveScreenshot();
});

test("api routes", async ({ request }) => {
  {
    const res = await request.get("/test/api/static");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      route: "/test/api/static",
      method: "GET",
      pathname: "/test/api/static",
      context: { params: {} },
    });
  }

  {
    const res = await request.post("/test/api/static", {
      data: "hey",
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      route: "/test/api/static",
      method: "POST",
      pathname: "/test/api/static",
      text: "hey",
      context: { params: {} },
    });
  }

  {
    const res = await request.get("/test/api/dynamic/hello");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      route: "/test/api/dynamic/[id]",
      method: "GET",
      pathname: "/test/api/dynamic/hello",
      context: { params: { id: "hello" } },
    });
  }

  {
    const res = await request.post("/test/api/dynamic/hello", {
      data: "hey",
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      route: "/test/api/dynamic/[id]",
      method: "POST",
      pathname: "/test/api/dynamic/hello",
      text: "hey",
      context: { params: { id: "hello" } },
    });
  }
});

test("cookies api route", async ({ request }) => {
  {
    const res = await request.get("/test/api/context");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      route: "/test/api/context",
      method: "GET",
    });
  }

  {
    const res = await request.post("/test/api/context", {
      form: {
        value: "hey",
      },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      cookie: "hey",
      route: "/test/api/context",
      method: "POST",
    });
  }

  {
    const res = await request.get("/test/api/context");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      cookie: "hey",
      route: "/test/api/context",
      method: "GET",
    });
  }
});

test("route groups @js", async ({ page }) => {
  await page.goto("/test/group");
  await waitForHydration(page);
  await testRouteGroups(page);
});

testNoJs("route groups @nojs", async ({ page }) => {
  await page.goto("/test/group");
  await testRouteGroups(page);
});

async function testRouteGroups(page: Page) {
  await page.getByRole("heading", { name: "(main)/layout.tsx" }).click();
  await page.getByText("(main)/page.tsx").click();

  await page.getByRole("link", { name: "• /test/group/electronics" }).click();
  await page.getByRole("heading", { name: "(shop)/layout.tsx" }).click();
  await page
    .getByRole("heading", { name: "(shop)/[categorySlug]/layout.tsx" })
    .click();
  await page
    .getByRole("heading", { name: "(shop)/[categorySlug]/page.tsx" })
    .click();
  await page.getByText('{"categorySlug":"electronics"}').click();

  await page
    .getByRole("link", { name: "• /test/group/electronics/phones" })
    .click();
  await page
    .getByRole("heading", { name: "(shop)/[categorySlug]/layout.tsx" })
    .click();
  await page
    .getByRole("heading", {
      name: "(shop)/[categorySlug]/[subCategorySlug]/page.tsx",
    })
    .click();
  await page
    .getByText('{"categorySlug":"electronics","subCategorySlug":"phones"}')
    .click();

  await page.getByRole("link", { name: "• /test/group/checkout" }).click();
  await page.getByRole("heading", { name: "(checkout)/layout.tsx" }).click();
  await page.getByText("(checkout)/checkout/page.tsx").click();
  await page.getByRole("link", { name: "Back" }).click();

  await page.getByRole("link", { name: "• /test/group/blog" }).click();
  await page.getByRole("heading", { name: "(marketing)/layout.tsx" }).click();
  await page.getByText("(marketing)/blog/page.tsx").click();
}

test("head inline script", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test");
  await waitForHydration(page);
  const result = await page.evaluate(
    () => (self as any).__testHeadInlineScript,
  );
  expect(result).toBe(true);
});
