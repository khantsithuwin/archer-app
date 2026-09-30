import { expect, test } from "@playwright/test";

test("freelancer signs in and opens a published job", async ({ page }) => {
  let accessToken: string | undefined;
  try {
    await page.goto("/login");
    await page.getByRole("button", { name: "Freelancer demo" }).click();
    const loginResponse = page.waitForResponse((response) => response.url().endsWith("/auth/login") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Continue" }).click();
    accessToken = (await (await loginResponse).json()).data.accessToken as string;

    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("link", { name: "Find work" }).click();
    await expect(page.getByRole("heading", { name: "Find work worth doing." })).toBeVisible();

    const firstJob = page.locator(".job-card .job-title").first();
    await expect(firstJob).toBeVisible();
    const title = (await firstJob.innerText()).trim();
    await firstJob.click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Your proposal stays private to this client.")).toBeVisible();
  } finally {
    if (accessToken) await page.request.post("http://127.0.0.1:4010/api/v1/auth/logout", { headers: { authorization: `Bearer ${accessToken}` } });
  }
});
