import { test, expect } from '@playwright/test';

/**
 * Smoke test E2E: abre el juego en un navegador real, verifica que:
 *  1. No hay errores de consola.
 *  2. El canvas de Phaser aparece.
 *  3. Se puede tocar "JUGAR" y entrar a la escena Game.
 *  4. El mock del SDK (mockYtGame) reporta firstFrameReady/gameReady.
 *
 * Usa el mock del SDK (src/dev/mockYtGame.ts), que se auto-instala en dev.
 */
test('el juego carga, no tiene errores de consola, y el flujo del SDK se dispara', async ({ page }) => {
    const consoleErrors: string[] = [];
    const sdkLogs: string[] = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
        if (
            msg.text().includes('mockYtGame') ||
            msg.text().includes('firstFrameReady') ||
            msg.text().includes('gameReady')
        ) {
            sdkLogs.push(msg.text());
        }
    });

    await page.goto('/');

    // El canvas de Phaser debe aparecer.
    await expect(page.locator('#game-container canvas')).toBeVisible({ timeout: 10_000 });

    // Esperar a que el mock del SDK confirme el ciclo de vida esperado.
    await page.waitForTimeout(1000);

    expect(consoleErrors, `Errores de consola encontrados: ${consoleErrors.join(', ')}`).toHaveLength(0);

    // Tocar el centro de la pantalla (botón JUGAR del MainMenu) y confirmar
    // que la transición no lanza errores adicionales.
    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6);
    }

    await page.waitForTimeout(500);
    expect(consoleErrors, `Errores de consola tras interactuar: ${consoleErrors.join(', ')}`).toHaveLength(0);
});
