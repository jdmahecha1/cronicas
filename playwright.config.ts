import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321/cronicas/',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  // Se prueba el sitio compilado (con el índice de Pagefind), igual que en GitHub Pages.
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321/cronicas/',
    reuseExistingServer: !process.env.CI,
  },
});
