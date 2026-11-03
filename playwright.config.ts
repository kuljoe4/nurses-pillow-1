import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '/home/jules/verification',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
