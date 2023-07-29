import type { Page } from "@playwright/test";

export async function isPageReady(page: Page) {
  await page.locator("#root.hydrated").waitFor({ state: "attached" });
}
