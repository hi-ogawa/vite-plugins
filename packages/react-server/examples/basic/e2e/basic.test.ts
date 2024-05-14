import { type Page, expect, test } from "@playwright/test";
import { checkNoError, editFile, inspectDevModules, testNoJs } from "./helper";

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

test("error", async ({ page }) => {
  const res = await page.goto("/test/error-not-found");
  expect(res?.status()).toBe(404);

  await waitForHydration(page);
  await page.getByText(`server error: {"status":404}`).click();

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

test("DefaultRootErrorPage", async ({ page }) => {
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
    s.replace("test-hmr-div", "test-hmr-edit-div"),
  );
  await page.getByText("test-hmr-edit-div").click();
  await page.getByText("Count: 1").click();

  // edit server again re-mounts client
  await editFile("./src/routes/test/page.tsx", (s) =>
    s.replace("Server (EDIT 1) Time", "Server (EDIT 2) Time"),
  );
  await page.getByText("Server (EDIT 2) Time").click();
  await page.getByText("Count: 0").click();

  // edit client again should work
  await page.getByRole("button", { name: "+" }).click();
  await page.getByText("Count: 1").click();
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-edit-div", "test-hmr-edit-edit-div"),
  );
  await page.getByText("test-hmr-edit-edit-div").click();
  await page.getByText("Count: 1").click();
});

test("module invalidation @dev", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  const moduleUrls = [
    "/src/entry-server",
    "/src/entry-react-server",
    "/src/routes/test/page",
    "/src/components/counter",
    "@hiogawa/react-server/entry-server",
    "@hiogawa/react-server/entry-react-server",
  ] as const;

  const result = await inspectDevModules(page, moduleUrls);
  expect(result).toMatchObject({
    "/src/entry-server": {
      ssr: expect.any(Object),
      "react-server": false,
    },
    "/src/entry-react-server": {
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
    "@hiogawa/react-server/entry-server": {
      ssr: expect.any(Object),
      "react-server": false,
    },
    "@hiogawa/react-server/entry-react-server": {
      ssr: false,
      "react-server": expect.any(Object),
    },
  });

  // each render doesn't invalidate anything
  await page.reload();
  await waitForHydration(page);

  const result2 = await inspectDevModules(page, moduleUrls);
  expect([
    result["/src/entry-server"].ssr.lastInvalidationTimestamp,
    result["/src/entry-react-server"]["react-server"].lastInvalidationTimestamp,
  ]).toEqual([
    result2["/src/entry-server"].ssr.lastInvalidationTimestamp,
    result2["/src/entry-react-server"]["react-server"]
      .lastInvalidationTimestamp,
  ]);

  // updating client component invalidates react-server entry
  // due to import.meta.glob dependency
  //   react server entry -> page -> client reference
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-div", "test-hmr-edit-div"),
  );
  await page.getByText("test-hmr-edit-div").click();

  const result3 = await inspectDevModules(page, moduleUrls);
  expect([result["/src/entry-server"].ssr.lastInvalidationTimestamp]).toEqual([
    result3["/src/entry-server"].ssr.lastInvalidationTimestamp,
  ]);

  const changed = [
    ["/src/entry-react-server", "react-server"],
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

test("server action @js", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/action");
  await waitForHydration(page);

  const checkClientState = await setupCheckClientState(page);

  await page.getByText("Count: 0").click();
  await page.getByRole("button", { name: "+1" }).first().click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "+1" }).nth(1).click();
  await page.getByText("Count: 2").click();
  await page.getByRole("button", { name: "+1" }).nth(2).click();
  await page.getByText("Count: 3").click();
  await page.getByRole("button", { name: "-1" }).first().click();
  await page.getByText("Count: 2").click();
  await page.getByRole("button", { name: "-1" }).nth(1).click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "-1" }).nth(2).click();
  await page.getByText("Count: 0").click();

  await checkClientState();

  // check layout doesn't re-render
  const count = process.env.E2E_PREVIEW ? 1 : 1;
  await page.getByText(`[effect: ${count}]`).click();
});

test("server action after client render", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await waitForHydration(page);

  // on client render, the form doesn't have hidden $ACTION_ID_...
  await page.getByRole("link", { name: "/test/action" }).click();

  const checkClientState = await setupCheckClientState(page);
  await testServerActionCounter(page);
  await checkClientState();

  // check layout doesn't re-render
  const count = process.env.E2E_PREVIEW ? 1 : 1;
  await page.getByText(`[effect: ${count}]`).click();
});

testNoJs("server action @nojs", async ({ page }) => {
  await page.goto("/test/action");
  await testServerActionCounter(page);
});

async function testServerActionCounter(page: Page) {
  await page.getByText("Count: 0").click();
  await page.getByRole("button", { name: "+1" }).first().click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "+1" }).nth(1).click();
  await page.getByText("Count: 2").click();
  await page.getByRole("button", { name: "+1" }).nth(2).click();
  await page.getByText("Count: 3").click();
  await page.getByRole("button", { name: "-1" }).first().click();
  await page.getByText("Count: 2").click();
  await page.getByRole("button", { name: "-1" }).nth(1).click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "-1" }).nth(2).click();
  await page.getByText("Count: 0").click();
}

test("ReactDom.useFormStatus", async ({ page }) => {
  await page.goto("/test/action");
  await waitForHydration(page);
  await page.getByRole("button", { name: "1.0 sec" }).click();
  await page.getByText("pending: true").click();
  await page.getByText("pending: false").click();
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

  // TODO: still dual package after HMR due to
  // `<id>?t=...` imported by client component
  // `<id>` imported by server component (as client reference)
  await page.reload();
  await waitForHydration(page);
  await page.getByText("Client2Context [not-ok]").click();
});

test("RouteProps.request", async ({ page }) => {
  await page.goto("/test/other");
  await waitForHydration(page);
  await page.getByText("searchParams = {}").click();
  await page.getByRole("link", { name: "hello" }).click();
  await page.getByText('searchParams = {"hello":""}').click();
});

test("custom entry-react-server", async ({ request }) => {
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
  await page.getByRole("link", { name: "From Server Component" }).click();
  await page.waitForURL("/test/redirect?ok=server-component");
});

test("redirect server component @js", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/redirect");
  await waitForHydration(page);
  await page.getByRole("link", { name: "From Server Component" }).click();
  await page.waitForURL("/test/redirect?ok=server-component");
});

testNoJs("redirect server action @nojs", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/redirect");
  await page.getByRole("button", { name: "From Server Action" }).click();
  await page.waitForURL("/test/redirect?ok=server-action");
});

test("redirect server action @js", async ({ page }) => {
  await page.goto("/test/redirect");
  await waitForHydration(page);
  await page.getByRole("button", { name: "From Server Action" }).click();
  await page.waitForURL("/test/redirect?ok=server-action");
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

async function testCatchallRoute(page: Page, options: { js: boolean }) {
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
  // state is preserved
  await expect(page.getByLabel("test state")).toBeChecked({
    checked: options.js,
  });
}

test("full client route", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/client/full");
  await page.getByRole("heading", { name: '"use client" layout' }).click();
  await page.getByRole("heading", { name: '"use client" page' }).click();
});

async function setupCheckClientState(page: Page) {
  // setup client state
  await page.getByPlaceholder("test-input").fill("hello");

  return async () => {
    // verify client state is preserved
    await expect(page.getByPlaceholder("test-input")).toHaveValue("hello");
  };
}

async function waitForHydration(page: Page) {
  await expect(page.getByText("[hydrated: 1]")).toBeVisible();
}
