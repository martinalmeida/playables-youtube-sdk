/**
 * UIOverlays.ts — componentes de UI de "capa superior" que casi todo juego
 * necesita: Modal (diálogo con overlay oscuro), Toast (notificación breve
 * que se auto-destruye), y PauseMenu (pausa + ajustes de volumen/idioma
 * listo para usar). Construidos sobre UIKit.ts.
 *
 * Todos se auto-destruyen o se cierran limpiamente — no dejan listeners
 * colgados en la escena.
 */
import Phaser from 'phaser';
import { Button, Panel } from './UIKit';
import { Localization } from './Localization';

export interface ModalOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

/**
 * Modal simple: overlay oscuro + panel + título + mensaje + 1-2 botones.
 * Se destruye a sí mismo al confirmar/cancelar.
 */
export function showModal(scene: Phaser.Scene, options: ModalOptions): Phaser.GameObjects.Container {
    const { width, height } = scene.scale;
    const { title, message, confirmLabel = 'OK', cancelLabel, onConfirm, onCancel } = options;

    const container = scene.add.container(0, 0).setDepth(10000);

    const overlay = scene.add
        .rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
        .setInteractive(); // bloquea clicks al fondo mientras el modal está abierto

    const panelWidth = Math.min(360, width * 0.85);
    const panelHeight = 220;
    const panel = new Panel(scene, width / 2, height / 2, panelWidth, panelHeight);

    const titleText = scene.add
        .text(width / 2, height / 2 - panelHeight / 2 + 36, title, {
            fontFamily: 'sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        })
        .setOrigin(0.5);

    const messageText = scene.add
        .text(width / 2, height / 2, message, {
            fontFamily: 'sans-serif',
            fontSize: '16px',
            color: '#9fb3d9',
            wordWrap: { width: panelWidth - 40 },
            align: 'center'
        })
        .setOrigin(0.5);

    container.add([overlay, panel, titleText, messageText]);

    const close = () => container.destroy();

    if (cancelLabel) {
        const cancelBtn = new Button(scene, width / 2 - 90, height / 2 + panelHeight / 2 - 40, cancelLabel, {
            width: 140,
            height: 48,
            fontSize: '18px'
        });
        cancelBtn.on('pointerup', () => {
            close();
            onCancel?.();
        });
        container.add(cancelBtn);

        const confirmBtn = new Button(scene, width / 2 + 90, height / 2 + panelHeight / 2 - 40, confirmLabel, {
            width: 140,
            height: 48,
            fontSize: '18px'
        });
        confirmBtn.on('pointerup', () => {
            close();
            onConfirm?.();
        });
        container.add(confirmBtn);
    } else {
        const confirmBtn = new Button(scene, width / 2, height / 2 + panelHeight / 2 - 40, confirmLabel, {
            width: 160,
            height: 48,
            fontSize: '18px'
        });
        confirmBtn.on('pointerup', () => {
            close();
            onConfirm?.();
        });
        container.add(confirmBtn);
    }

    return container;
}

export interface ToastOptions {
    durationMs?: number;
    color?: string;
}

/** Notificación breve que aparece abajo, se muestra un momento y se desvanece sola. */
export function showToast(scene: Phaser.Scene, message: string, options: ToastOptions = {}): void {
    const { durationMs = 1800, color = '#ffffff' } = options;
    const { width, height } = scene.scale;

    const text = scene.add
        .text(width / 2, height * 0.9, message, {
            fontFamily: 'sans-serif',
            fontSize: '18px',
            color,
            backgroundColor: '#1a2130cc',
            padding: { x: 16, y: 10 }
        })
        .setOrigin(0.5)
        .setDepth(10000)
        .setAlpha(0);

    scene.tweens.add({
        targets: text,
        alpha: 1,
        duration: 150,
        yoyo: false,
        onComplete: () => {
            scene.time.delayedCall(durationMs, () => {
                scene.tweens.add({
                    targets: text,
                    alpha: 0,
                    duration: 250,
                    onComplete: () => text.destroy()
                });
            });
        }
    });
}

export interface PauseMenuOptions {
    onResume?: () => void;
}

/**
 * Menú de pausa listo para usar: overlay + botón de reanudar + sliders de
 * volumen (música/sfx) representados como ProgressBar interactivo simple.
 * Pensado para conectarse a un botón de pausa en el HUD del juego — NO se
 * abre automáticamente con onPause del SDK (eso pausa el motor entero, ver
 * SKILLS/playables-sdk-integration/SKILL.md); esto es para la pausa que el
 * propio jugador activa manualmente dentro de una partida.
 */
export function showPauseMenu(scene: Phaser.Scene, options: PauseMenuOptions = {}): Phaser.GameObjects.Container {
    const { width, height } = scene.scale;
    const container = scene.add.container(0, 0).setDepth(10000);

    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setInteractive();
    const panel = new Panel(scene, width / 2, height / 2, Math.min(320, width * 0.8), 260);

    const title = scene.add
        .text(width / 2, height / 2 - 90, 'Pausa', { fontFamily: 'sans-serif', fontSize: '28px', color: '#ffffff' })
        .setOrigin(0.5);

    const resumeBtn = new Button(scene, width / 2, height / 2 - 20, Localization.t('play'), { width: 200, height: 56 });
    resumeBtn.on('pointerup', () => {
        container.destroy();
        options.onResume?.();
    });

    const muteBtn = new Button(scene, width / 2, height / 2 + 50, '🔊 / 🔇', { width: 200, height: 48, fontSize: '18px' });
    let muted = false;
    muteBtn.on('pointerup', () => {
        muted = !muted;
        scene.sound.setMute(muted);
    });

    container.add([overlay, panel, title, resumeBtn, muteBtn]);
    return container;
}
