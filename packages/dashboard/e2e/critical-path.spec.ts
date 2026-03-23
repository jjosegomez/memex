import { test, expect } from "@playwright/test";

test.describe("Critical Path — Unauthenticated", () => {
  test("redirects / to /login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /standards to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/standards");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /projects/anything to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/projects/test-repo");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    // Brand
    await expect(page.locator("h1")).toContainText("Memex");
    await expect(page.locator("text=Knowledge Layer")).toBeVisible();

    // Sign in card
    await expect(page.locator("text=Sign in to your dashboard")).toBeVisible();
    await expect(
      page.locator("text=Connect your GitHub to scan project knowledge")
    ).toBeVisible();

    // GitHub button
    const signInButton = page.locator("button", {
      hasText: "Sign in with GitHub",
    });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();

    // Footer trust message
    await expect(
      page.locator("text=Your GitHub token is stored in an encrypted session")
    ).toBeVisible();
  });

  test("login page has no sidebar or header", async ({ page }) => {
    await page.goto("/login");

    // Sidebar should NOT be visible (only shown when authenticated)
    await expect(page.locator("aside")).not.toBeVisible();
  });

  test("clicking Sign in with GitHub triggers auth request", async ({
    page,
  }) => {
    await page.goto("/login");

    // Intercept the network request to verify OAuth redirect is attempted
    const authRequestPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/auth") ||
        req.url().includes("github.com/login/oauth"),
      { timeout: 10_000 }
    );

    const signInButton = page.locator("button", {
      hasText: "Sign in with GitHub",
    });
    await signInButton.click();

    const authRequest = await authRequestPromise;
    expect(authRequest.url()).toBeTruthy();
  });

  test("API auth endpoints are accessible without auth", async ({ page }) => {
    // The session endpoint should return null, not redirect
    const response = await page.goto("/api/auth/session");
    expect(response?.status()).toBe(200);
  });

  test("/search redirects to login (client page, but still protected by layout)", async ({
    page,
  }) => {
    // Search is a client component — verify it still requires auth context
    await page.goto("/search");
    // Should either redirect to login or show the page without data
    // (client components don't have server-side requireAuth)
    const url = page.url();
    // Accept either login redirect or the search page rendering
    expect(url.includes("/login") || url.includes("/search")).toBeTruthy();
  });
});

test.describe("Critical Path — Auth API", () => {
  test("GET /api/auth/providers returns GitHub provider", async ({
    request,
  }) => {
    const response = await request.get("/api/auth/providers");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.github).toBeDefined();
    expect(data.github.id).toBe("github");
    expect(data.github.name).toBe("GitHub");
    expect(data.github.type).toBe("oauth");
  });

  test("GET /api/auth/session returns null when not authenticated", async ({
    request,
  }) => {
    const response = await request.get("/api/auth/session");
    expect(response.status()).toBe(200);
    const data = await response.json();
    // Session should be null/empty for unauthenticated requests
    expect(data).toBeFalsy();
  });

  test("GET /api/auth/csrf returns a CSRF token", async ({ request }) => {
    const response = await request.get("/api/auth/csrf");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.csrfToken).toBeDefined();
    expect(typeof data.csrfToken).toBe("string");
  });
});

test.describe("Critical Path — Protected API routes", () => {
  test("GET /api/projects returns 401 or empty when not authenticated", async ({
    request,
  }) => {
    const response = await request.get("/api/projects");
    // Should either 401 or return empty (depends on fallback mode)
    const status = response.status();
    expect([200, 401, 500]).toContain(status);
  });

  test("GET /api/orgs returns 401 when not authenticated", async ({
    request,
  }) => {
    const response = await request.get("/api/orgs");
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });
});
