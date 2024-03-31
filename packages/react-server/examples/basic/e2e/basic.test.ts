import { type Page, expect, test } from "@playwright/test";
import { checkNoError, editFile } from "./helper";

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

  // strict mode doubles initial effect
  const count = process.env.E2E_PREVIEW ? 1 : 2;
  await page.getByText(`[effect: ${count}]`).click();
  await page.getByRole("link", { name: "/test/other" }).click();
  await page.getByText(`[effect: ${count}]`).click();
  await page.goBack();
  await page.getByText(`[effect: ${count}]`).click();
});

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
  await page.getByRole("link", { name: "Posts (2.0 sec)" }).click();
  await expect(page.getByRole("link", { name: "About" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await expect(
    page.getByRole("link", { name: "Posts (2.0 sec)" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("link", { name: "Posts (2.0 sec)" })).toHaveClass(
    /opacity-50/,
  );
  await expect(
    page.getByRole("link", { name: "Posts (2.0 sec)" }),
  ).not.toHaveClass(/opacity-50/);
  await page.getByText("Took 2 sec to load.").click();
});

test.skip("ServerTransitionContext.isActionPending", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test/transition");
  await waitForHydration(page);

  await expect(page.getByText("Count: 0")).not.toHaveClass(/opacity-50/);
  await page.getByRole("button", { name: "-1 (2.0 sec)" }).click();
  await expect(page.getByText("Count: 0")).toHaveClass(/opacity-50/);
  await expect(page.getByText("Count: -1")).not.toHaveClass(/opacity-50/);
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
  const res = await page.goto("/test/not-found");
  expect(res?.status()).toBe(404);

  await waitForHydration(page);
  await page.getByText(`server error: {"status":404}`).click();

  const checkClientState = await setupCheckClientState(page);

  await page.getByRole("link", { name: "/test/error" }).click();
  await page.getByRole("link", { name: "Server 500" }).click();
  await page.getByText('server error: {"status":500}').click();

  await page.getByRole("link", { name: "/test/error" }).click();
  await page.getByRole("link", { name: "Server Custom" }).click();
  await page
    .getByText('server error: {"status":403,"customMessage":"hello"}')
    .click();

  await page.getByRole("link", { name: "/test/error" }).click();
  await page.getByRole("link", { name: "Browser" }).click();
  await page.getByText("server error: (N/A)").click();

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
  const res = await page.request.get("/test");
  expect(await res.text()).toContain("<div>test-hmr-edit-div</div>");
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

test("react-server css", async ({ page }) => {
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

test("react-server css @nojs", async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false });

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

test("server action with js", async ({ page }) => {
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
});

test("server action no js", async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto("/test/action");
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
});

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
