import { createHash } from "node:crypto";
import { type Page, expect, test } from "@playwright/test";
import {
  createEditor,
  expectNoReload,
  testNoJs,
  waitForHydration,
} from "./helper";

test("basic", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
});

test("client component", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
  await page.getByRole("button", { name: "Client Counter: 1" }).click();
});

test("server action @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testAction(page);
});

testNoJs("server action @nojs", async ({ page }) => {
  await page.goto("./");
  await testAction(page);
});

async function testAction(page: Page) {
  await page.getByRole("button", { name: "Server Counter: 0" }).click();
  await page.getByRole("button", { name: "Server Counter: 1" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 2" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Server Reset" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 0" }),
  ).toBeVisible();
}

test("useActionState @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testUseActionState(page);
});

testNoJs("useActionState @nojs", async ({ page }) => {
  await page.goto("./");
  await testUseActionState(page);
});

async function testUseActionState(page: Page) {
  await expect(page.getByTestId("use-action-state")).toContainText(
    "test-useActionState: 0",
  );
  await page.getByTestId("use-action-state").click();
  await expect(page.getByTestId("use-action-state")).toContainText(
    "test-useActionState: 1",
  );
  await page.getByTestId("use-action-state").click();
  await expect(page.getByTestId("use-action-state")).toContainText(
    "test-useActionState: 2",
  );
}

test("useActionState with jsx @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testUseActionStateJsx(page);
});

testNoJs("useActionState with jsx @nojs", async ({ page }) => {
  await page.goto("./");
  await testUseActionStateJsx(page, { js: false });
});

async function testUseActionStateJsx(page: Page, options?: { js?: boolean }) {
  await page.getByTestId("use-action-state-jsx").getByRole("button").click();
  await expect(page.getByTestId("use-action-state-jsx")).toContainText(
    /\(ok\)/,
  );

  // 1st call "works" but it shows an error during reponse and it breaks 2nd call.
  //   Failed to serialize an action for progressive enhancement:
  //   Error: React Element cannot be passed to Server Functions from the Client without a temporary reference set. Pass a TemporaryReferenceSet to the options.
  //     [Promise, <span/>]
  if (!options?.js) return;

  await page.getByTestId("use-action-state-jsx").getByRole("button").click();
  await expect(page.getByTestId("use-action-state-jsx")).toContainText(
    /\(ok\).*\(ok\)/,
  );
}

testNoJs("module preload on ssr @build", async ({ page }) => {
  await page.goto("./");
  const srcs = await page
    .locator(`head >> link[rel="modulepreload"]`)
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("href")));
  const { default: manifest } = await import(
    "../dist/ssr/__vite_rsc_assets_manifest.js" as any
  );
  const hashString = (v: string) =>
    createHash("sha256").update(v).digest().toString("hex").slice(0, 12);
  const deps =
    manifest.clientReferenceDeps[hashString("src/routes/client.tsx")];
  expect(srcs).toEqual(expect.arrayContaining(deps.js));
});

test("server reference update @dev @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testServerActionUpdate(page, { js: true });
});

test("server reference update @dev @nojs", async ({ page }) => {
  await page.goto("./");
  await testServerActionUpdate(page, { js: false });
});

async function testServerActionUpdate(page: Page, options: { js: boolean }) {
  await page.getByRole("button", { name: "Server Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 1" }),
  ).toBeVisible();

  // update server code
  const editor = createEditor("src/routes/action.tsx");
  editor.edit((s) =>
    s.replace("const TEST_UPDATE = 1;", "const TEST_UPDATE = 10;"),
  );
  await expect(async () => {
    if (!options.js) await page.goto("./");
    await expect(
      page.getByRole("button", { name: "Server Counter: 0" }),
    ).toBeVisible({ timeout: 10 });
  }).toPass();

  await page.getByRole("button", { name: "Server Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 10" }),
  ).toBeVisible();

  editor.reset();
  await expect(async () => {
    if (!options.js) await page.goto("./");
    await expect(
      page.getByRole("button", { name: "Server Counter: 0" }),
    ).toBeVisible({ timeout: 10 });
  }).toPass();
}

test("client hmr @dev", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Client Counter: 1" }),
  ).toBeVisible();

  const editor = createEditor("src/routes/client.tsx");
  editor.edit((s) => s.replace("Client Counter", "Client [edit] Counter"));
  await expect(
    page.getByRole("button", { name: "Client [edit] Counter: 1" }),
  ).toBeVisible();

  // check next ssr is also updated
  const res = await page.goto("./");
  expect(await res?.text()).toContain("Client [edit] Counter");
  editor.reset();
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
});

test("non-boundary client hmr @dev", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);

  await page
    .getByRole("textbox", { name: "test-client-dep-state" })
    .fill("test");

  const editor = createEditor("src/routes/client-dep.tsx");
  editor.edit((s) =>
    s.replace("test-client-dep-state", "test-client-[edit]-dep-state"),
  );
  await expect(
    page.getByRole("textbox", { name: "test-client-[edit]-dep-state" }),
  ).toHaveValue("test");

  // check next ssr is also updated
  const res = await page.goto("./");
  expect(await res?.text()).toContain("test-client-[edit]-dep-state");

  await waitForHydration(page);
  editor.reset();
  await expect(
    page.getByRole("textbox", { name: "test-client-dep-state" }),
  ).toBeVisible();
});

test("server hmr @dev", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  const editor = createEditor("src/routes/root.tsx");
  editor.edit((s) => s.replace("Server Counter", "Server [edit] Counter"));
  await expect(
    page.getByRole("button", { name: "Server [edit] Counter: 0" }),
  ).toBeVisible();
  editor.reset();
  await expect(
    page.getByRole("button", { name: "Server Counter: 0" }),
  ).toBeVisible();
});

test("css @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await testCss(page);
});

testNoJs("css @nojs", async ({ page }) => {
  await page.goto("./");
  await testCss(page);
});

async function testCss(page: Page, color = "rgb(255, 165, 0)") {
  await expect(page.locator(".test-style-client")).toHaveCSS("color", color);
  await expect(page.locator(".test-style-server")).toHaveCSS("color", color);
}

test("css hmr client @dev", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);

  await using _ = await expectNoReload(page);
  const editor = createEditor("src/routes/client.css");
  editor.edit((s) => s.replaceAll("rgb(255, 165, 0)", "rgb(0, 165, 255)"));
  await expect(page.locator(".test-style-client")).toHaveCSS(
    "color",
    "rgb(0, 165, 255)",
  );
  editor.edit((s) =>
    s.replaceAll(`color: rgb(0, 165, 255);`, `/* color: rgb(0, 165, 255); */`),
  );
  await expect(page.locator(".test-style-client")).toHaveCSS(
    "color",
    "rgb(0, 0, 0)",
  );
  editor.reset();
  await expect(page.locator(".test-style-client")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );
});

test("adding/removing css client @dev @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testAddRemoveCssClient(page, { js: true });
});

testNoJs("adding/removing css client @dev @nojs", async ({ page }) => {
  await page.goto("./");
  await testAddRemoveCssClient(page, { js: false });
});

async function testAddRemoveCssClient(page: Page, options: { js: boolean }) {
  await expect(page.locator(".test-style-client-dep")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );

  // remove css import
  const editor = createEditor("src/routes/client-dep.tsx");
  editor.edit((s) =>
    s.replaceAll(
      `import "./client-dep.css";`,
      `/* import "./client-dep.css"; */`,
    ),
  );
  await page.waitForTimeout(100);
  await expect(async () => {
    if (!options.js) await page.reload();
    await expect(page.locator(".test-style-client-dep")).toHaveCSS(
      "color",
      "rgb(0, 0, 0)",
      { timeout: 10 },
    );
  }).toPass();

  // add back css import
  editor.reset();
  await page.waitForTimeout(100);
  await expect(async () => {
    if (!options.js) await page.reload();
    await expect(page.locator(".test-style-client-dep")).toHaveCSS(
      "color",
      "rgb(255, 165, 0)",
      { timeout: 10 },
    );
  }).toPass();
}

test("css hmr server @dev", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);

  await using _ = await expectNoReload(page);
  const editor = createEditor("src/routes/server.css");
  editor.edit((s) => s.replaceAll("rgb(255, 165, 0)", "rgb(0, 165, 255)"));
  await expect(page.locator(".test-style-server")).toHaveCSS(
    "color",
    "rgb(0, 165, 255)",
  );
  editor.edit((s) =>
    s.replaceAll(`color: rgb(0, 165, 255);`, `/* color: rgb(0, 165, 255); */`),
  );
  await expect(page.locator(".test-style-server")).toHaveCSS(
    "color",
    "rgb(0, 0, 0)",
  );
  editor.reset();
  await expect(page.locator(".test-style-server")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );
});

// TODO: need a way to add/remove links on server hmr. for now, it requires a manually reload.
test.skip("adding/removing css server @dev @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testAddRemoveCssServer(page, { js: true });
});

testNoJs("adding/removing css server @dev @nojs", async ({ page }) => {
  await page.goto("./");
  await testAddRemoveCssServer(page, { js: false });
});

async function testAddRemoveCssServer(page: Page, options: { js: boolean }) {
  await expect(page.locator(".test-style-server")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );

  // remove css import
  const editor = createEditor("src/routes/root.tsx");
  editor.edit((s) =>
    s.replaceAll(`import "./server.css";`, `/* import "./server.css"; */`),
  );
  await page.waitForTimeout(100);
  await expect(async () => {
    if (!options.js) await page.reload();
    await expect(page.locator(".test-style-server")).toHaveCSS(
      "color",
      "rgb(0, 0, 0)",
      { timeout: 10 },
    );
  }).toPass();

  // add back css import
  editor.reset();
  await page.waitForTimeout(100);
  await expect(async () => {
    if (!options.js) await page.reload();
    await expect(page.locator(".test-style-server")).toHaveCSS(
      "color",
      "rgb(255, 165, 0)",
      { timeout: 10 },
    );
  }).toPass();
}

test("css client no ssr", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await page.getByRole("link", { name: "test-client-style-no-ssr" }).click();
  await expect(page.locator(".test-style-client-2")).toHaveCSS(
    "color",
    "rgb(0, 200, 100)",
  );
});

test("css module client @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await expect(page.getByTestId("css-module-client")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );

  if (process.env.E2E_PREVIEW) return;

  // test client css module HMR
  await using _ = await expectNoReload(page);
  const editor = createEditor("src/routes/client.module.css");
  editor.edit((s) => s.replaceAll("rgb(255, 165, 0)", "rgb(0, 165, 255)"));
  await expect(page.getByTestId("css-module-client")).toHaveCSS(
    "color",
    "rgb(0, 165, 255)",
  );
  editor.reset();
  await expect(page.getByTestId("css-module-client")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );
});

test("css module server @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await expect(page.getByTestId("css-module-server")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );

  if (process.env.E2E_PREVIEW) return;

  // test server css module HMR
  await using _ = await expectNoReload(page);
  const editor = createEditor("src/routes/server.module.css");
  editor.edit((s) => s.replaceAll("rgb(255, 165, 0)", "rgb(0, 165, 255)"));
  await expect(page.getByTestId("css-module-server")).toHaveCSS(
    "color",
    "rgb(0, 165, 255)",
  );
  editor.reset();
  await expect(page.getByTestId("css-module-server")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );
});

testNoJs("css module @nojs", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("css-module-client")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );
  await expect(page.getByTestId("css-module-server")).toHaveCSS(
    "color",
    "rgb(255, 165, 0)",
  );
});

test("tailwind @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await testTailwind(page);
});

testNoJs("tailwind @nojs", async ({ page }) => {
  await page.goto("./");
  await testTailwind(page);
});

async function testTailwind(page: Page) {
  await expect(page.locator(".test-tw-client")).toHaveCSS(
    "color",
    // blue-500
    "oklch(0.623 0.214 259.815)",
  );
  await expect(page.locator(".test-tw-server")).toHaveCSS(
    "color",
    // red-500
    "oklch(0.637 0.237 25.331)",
  );
}

test("tailwind hmr @dev", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await testTailwind(page);

  await using _ = await expectNoReload(page);

  const clientFile = createEditor("src/routes/client.tsx");
  clientFile.edit((s) => s.replaceAll("text-blue-500", "text-blue-600"));
  await expect(page.locator(".test-tw-client")).toHaveCSS(
    "color",
    "oklch(0.546 0.245 262.881)",
  );
  clientFile.reset();
  await expect(page.locator(".test-tw-client")).toHaveCSS(
    "color",
    "oklch(0.623 0.214 259.815)",
  );

  const serverFile = createEditor("src/routes/root.tsx");
  serverFile.edit((s) => s.replaceAll("text-red-500", "text-red-600"));
  await expect(page.locator(".test-tw-server")).toHaveCSS(
    "color",
    "oklch(0.577 0.245 27.325)",
  );
  serverFile.reset();
  await expect(page.locator(".test-tw-server")).toHaveCSS(
    "color",
    "oklch(0.637 0.237 25.331)",
  );
});

testNoJs("no FOUC after server restart @dev @nojs", async ({ page }) => {
  const res = await page.request.get("/__test_restart");
  expect(await res.text()).toBe("ok");
  await new Promise((r) => setTimeout(r, 100));
  await page.goto("./");
  await testCss(page);
  await testTailwind(page);
});

test("temporary references @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await page.getByRole("button", { name: "test-temporary-reference" }).click();
  await expect(page.getByTestId("temporary-reference")).toContainText(
    "result: [server [client]]",
  );
});

test("findSourceMapURL @js", async ({ page }) => {
  // it doesn't seem possible to assert react error stack mapping on playwright.
  // this need to be verified manually on browser devtools console.
  await page.goto("./");
  await waitForHydration(page);
  await page.getByRole("button", { name: "test-findSourceMapURL" }).click();
  await expect(page.getByText("ErrorBoundary caught")).toBeVisible();
  await page.getByRole("button", { name: "Reset Error" }).click();
  await expect(
    page.getByRole("button", { name: "test-findSourceMapURL" }),
  ).toBeVisible();
});

test("hydrate while streaming @js", async ({ page }) => {
  // client is interactive before suspense is resolved
  await page.goto("./?test-suspense=1000", { waitUntil: "commit" });
  await waitForHydration(page);
  await expect(page.getByTestId("suspense")).toContainText("suspense-fallback");
  await expect(page.getByTestId("suspense")).toContainText("suspense-resolved");
});

test("ssr rsc payload encoding", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await expect(page.getByTestId("ssr-rsc-payload")).toHaveText(
    "test-payload: test1: true, test2: true, test3: false, test4: true",
  );

  await page.goto("./?test-binary");
  await waitForHydration(page);
  await expect(page.getByTestId("ssr-rsc-payload")).toHaveText(
    "test-payload: test1: true, test2: true, test3: true, test4: true",
  );
});

test("action bind simple @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testActionBindSimple(page);
});

testNoJs("action bind simple @nojs", async ({ page }) => {
  await page.goto("./");
  await testActionBindSimple(page);
});

async function testActionBindSimple(page: Page) {
  await expect(page.getByTestId("test-server-action-bind-simple")).toHaveText(
    "[?]",
  );
  await page
    .getByRole("button", { name: "test-server-action-bind-simple" })
    .click();
  await expect(page.getByTestId("test-server-action-bind-simple")).toHaveText(
    "true",
  );
  await page
    .getByRole("button", { name: "test-server-action-bind-reset" })
    .click();
}

test("action bind client @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testActionBindClient(page);
});

// this doesn't work on Next either https://github.com/hi-ogawa/reproductions/tree/main/next-rsc-client-action-bind
testNoJs.skip("action bind client @nojs", async ({ page }) => {
  await page.goto("./");
  await testActionBindClient(page);
});

async function testActionBindClient(page: Page) {
  await expect(page.getByTestId("test-server-action-bind-client")).toHaveText(
    "[?]",
  );
  await page
    .getByRole("button", { name: "test-server-action-bind-client" })
    .click();
  await expect(page.getByTestId("test-server-action-bind-client")).toHaveText(
    "true",
  );
  await page
    .getByRole("button", { name: "test-server-action-bind-reset" })
    .click();
}

test("action bind action @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await testActionBindAction(page);
});

testNoJs("action bind action @nojs", async ({ page }) => {
  await page.goto("./");
  await testActionBindAction(page);
});

async function testActionBindAction(page: Page) {
  await expect(page.getByTestId("test-server-action-bind-action")).toHaveText(
    "[?]",
  );
  await page
    .getByRole("button", { name: "test-server-action-bind-action" })
    .click();
  await expect(page.getByTestId("test-server-action-bind-action")).toHaveText(
    "[true,true]",
  );
  await page
    .getByRole("button", { name: "test-server-action-bind-reset" })
    .click();
}

test("test serialization @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await expect(page.getByTestId("serialization")).toHaveText("?");
  await page.getByTestId("serialization").click();
  await expect(page.getByTestId("serialization")).toHaveText("ok");
});

test("client-in-server package", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("client-in-server")).toHaveText(
    "[test-client-in-server-dep: true]",
  );
  await expect(page.getByTestId("provider-in-server")).toHaveText(
    "[test-provider-in-server-dep: true]",
  );
});

test("server-in-server package", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await expect(page.getByTestId("server-in-server")).toHaveText(
    "[server-in-server: 0]",
  );
  await page.getByTestId("server-in-server").click();
  await expect(page.getByTestId("server-in-server")).toHaveText(
    "[server-in-server: 1]",
  );
  await page.reload();
  await expect(page.getByTestId("server-in-server")).toHaveText(
    "[server-in-server: 1]",
  );
});

test("server-in-client package", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await expect(page.getByTestId("server-in-client")).toHaveText(
    "[server-in-client: ?]",
  );
  await page.getByTestId("server-in-client").click();
  await expect(page.getByTestId("server-in-client")).toHaveText(
    "[server-in-client: 1]",
  );
  await page.reload();
  await waitForHydration(page);
  await expect(page.getByTestId("server-in-client")).toHaveText(
    "[server-in-client: ?]",
  );
  await page.getByTestId("server-in-client").click();
  await expect(page.getByTestId("server-in-client")).toHaveText(
    "[server-in-client: 2]",
  );
});

test("use cache function", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  const locator = page.getByTestId("test-use-cache-fn");
  await expect(locator.locator("span")).toHaveText(
    "(actionCount: 0, cacheFnCount: 0)",
  );
  await locator.getByRole("button").click();
  await expect(locator.locator("span")).toHaveText(
    "(actionCount: 1, cacheFnCount: 1)",
  );
  await locator.getByRole("button").click();
  await expect(locator.locator("span")).toHaveText(
    "(actionCount: 2, cacheFnCount: 1)",
  );
  await locator.getByRole("textbox").fill("test");
  await locator.getByRole("button").click();
  await expect(locator.locator("span")).toHaveText(
    "(actionCount: 3, cacheFnCount: 2)",
  );
  await locator.getByRole("button").click();
  await expect(locator.locator("span")).toHaveText(
    "(actionCount: 4, cacheFnCount: 2)",
  );
});

test("use cache component", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
});
