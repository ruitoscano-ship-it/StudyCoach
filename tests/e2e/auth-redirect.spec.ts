import { test, expect } from "@playwright/test";

test("protected parent route redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/encarregado");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fencarregado/);
});
