import { defineConfig } from '@playwright/test';

/**
 * Config de Playwright para el smoke test E2E (ver tests/e2e/smoke.spec.ts).
 * Arranca el server de dev de Vite automáticamente y corre contra Chromium.
 * No reemplaza al Test Suite oficial de YouTube Playables — es una capa
 * previa, más rápida, para atrapar errores obvios antes de probar ahí.
 */
export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 30_000,
    webServer: {
        command: 'npm run dev -- --port 8081',
        url: 'http://localhost:8081',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
    },
    use: {
        baseURL: 'http://localhost:8081'
    }
});
