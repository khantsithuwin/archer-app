import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:5173", browserName: "chromium", headless: true },
  webServer: [
    {
      command: "touch /tmp/archer-app-e2e.db && DATABASE_URL=file:/tmp/archer-app-e2e.db npm run db:deploy && DATABASE_URL=file:/tmp/archer-app-e2e.db npm run seed:demo && DATABASE_URL=file:/tmp/archer-app-e2e.db npm run dev",
      cwd: "../archer-api",
      url: "http://127.0.0.1:4010/api/v1/health/live",
      reuseExistingServer: false,
      env: { PORT: "4010", LOG_LEVEL: "silent", CORS_ORIGINS: "http://127.0.0.1:5173" },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
      env: { VITE_API_URL: "http://127.0.0.1:4010/api/v1" },
    },
  ],
});
