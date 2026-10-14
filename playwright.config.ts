import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: { command: "npm run dev -- --hostname 127.0.0.1", url: "http://127.0.0.1:3000", reuseExistingServer: true, timeout: 60000 },
});
