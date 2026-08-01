/**
 * SfxSynth.ts
 *
 * Generador procedural de efectos de sonido vía Web Audio API. Existe
 * porque un SDK "100% listo para producción" necesita audio, pero:
 *   1. No podemos empaquetar archivos de audio de terceros (derechos de
 *      autor/licencias), y
 *   2. Un agente de IA generando un juego no tiene forma de "conseguir"
 *      assets de audio reales sin intervención humana.
 *
 * La solución: sintetizar los efectos más comunes de gamedev (coin, jump,
 * hit, explosion, click, powerup, select, error, win, lose) en tiempo real
 * con osciladores/ruido — cero dependencias externas, cero problemas de
 * licencia, cero peso extra en el bundle.
 *
 * Para MÚSICA o efectos que requieran calidad orgánica (voces, instrumentos
 * reales), esto no es sustituto — ahí el usuario humano debe aportar sus
 * propios assets (ver SKILLS/asset-pipeline/SKILL.md, sección de fuentes
 * recomendadas de audio con licencia libre).
 *
 * Uso:
 *   import { SfxSynth } from '../core/SfxSynth';
 *   SfxSynth.play('coin');
 *   SfxSynth.play('jump', { pitch: 1.2 }); // pitch: multiplicador de frecuencia
 */

export type SfxPreset =
    'coin' | 'jump' | 'hit' | 'explosion' | 'click' | 'powerup' | 'select' | 'error' | 'win' | 'lose';

interface PlayOptions {
    /** Multiplicador de frecuencia base (1 = normal, 1.2 = más agudo, 0.8 = más grave) */
    pitch?: number;
    /** Volumen 0-1 */
    volume?: number;
}

type OscType = OscillatorType;

interface ToneStep {
    type: OscType;
    freqStart: number;
    freqEnd?: number;
    durationMs: number;
    gainStart?: number;
    gainEnd?: number;
}

class SfxSynthImpl {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private masterVolume = 0.5;
    private muted = false;

    private ensureContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            void this.ctx.resume();
        }
        return this.ctx;
    }

    setMasterVolume(value: number): void {
        this.masterVolume = Math.min(Math.max(value, 0), 1);
        if (this.masterGain && !this.muted) this.masterGain.gain.value = this.masterVolume;
    }

    /** Alias de setMasterVolume, para encajar con la nomenclatura de AudioManager. */
    setVolume(value: number): void {
        this.setMasterVolume(value);
    }

    /** Silencia/reactiva todos los sonidos sintetizados (ej. al mutear el reproductor de YouTube). */
    setMuted(muted: boolean): void {
        this.muted = muted;
        if (this.masterGain) this.masterGain.gain.value = muted ? 0 : this.masterVolume;
    }

    /**
     * Reproduce un preset. Si el navegador no soporta Web Audio (muy raro,
     * pero posible en algún WebView antiguo), falla en silencio en vez de
     * romper el juego.
     */
    play(preset: SfxPreset, options: PlayOptions = {}): void {
        try {
            const ctx = this.ensureContext();
            const steps = this.buildSteps(preset, options.pitch ?? 1);
            this.scheduleSteps(ctx, steps, options.volume ?? 1);
        } catch (err) {
            console.warn('[SfxSynth] No se pudo reproducir el sonido:', err);
        }
    }

    private scheduleSteps(ctx: AudioContext, steps: ToneStep[], volumeMultiplier: number): void {
        let cursor = ctx.currentTime;

        for (const step of steps) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = step.type;
            osc.frequency.setValueAtTime(step.freqStart, cursor);
            if (step.freqEnd !== undefined) {
                osc.frequency.linearRampToValueAtTime(step.freqEnd, cursor + step.durationMs / 1000);
            }

            const gStart = (step.gainStart ?? 0.3) * volumeMultiplier;
            const gEnd = (step.gainEnd ?? 0) * volumeMultiplier;
            gain.gain.setValueAtTime(gStart, cursor);
            gain.gain.linearRampToValueAtTime(gEnd, cursor + step.durationMs / 1000);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(cursor);
            osc.stop(cursor + step.durationMs / 1000);

            cursor += step.durationMs / 1000;
        }
    }

    /**
     * Define la "receta" de cada preset como una secuencia de tonos. Son
     * deliberadamente simples (2-4 pasos) — el objetivo es feedback claro
     * de UI/gameplay, no diseño sonoro elaborado.
     */
    private buildSteps(preset: SfxPreset, pitch: number): ToneStep[] {
        const f = (hz: number) => hz * pitch;

        switch (preset) {
            case 'coin':
                return [
                    {
                        type: 'square',
                        freqStart: f(880),
                        freqEnd: f(1320),
                        durationMs: 80,
                        gainStart: 0.25,
                        gainEnd: 0.0
                    },
                    {
                        type: 'square',
                        freqStart: f(1320),
                        freqEnd: f(1760),
                        durationMs: 90,
                        gainStart: 0.2,
                        gainEnd: 0.0
                    }
                ];
            case 'jump':
                return [
                    {
                        type: 'square',
                        freqStart: f(300),
                        freqEnd: f(600),
                        durationMs: 150,
                        gainStart: 0.25,
                        gainEnd: 0.0
                    }
                ];
            case 'hit':
                return [
                    {
                        type: 'sawtooth',
                        freqStart: f(180),
                        freqEnd: f(60),
                        durationMs: 120,
                        gainStart: 0.3,
                        gainEnd: 0.0
                    }
                ];
            case 'explosion':
                return [
                    {
                        type: 'sawtooth',
                        freqStart: f(150),
                        freqEnd: f(30),
                        durationMs: 300,
                        gainStart: 0.35,
                        gainEnd: 0.0
                    },
                    {
                        type: 'triangle',
                        freqStart: f(80),
                        freqEnd: f(20),
                        durationMs: 200,
                        gainStart: 0.2,
                        gainEnd: 0.0
                    }
                ];
            case 'click':
                return [{ type: 'square', freqStart: f(1000), durationMs: 40, gainStart: 0.2, gainEnd: 0.0 }];
            case 'powerup':
                return [
                    {
                        type: 'square',
                        freqStart: f(440),
                        freqEnd: f(880),
                        durationMs: 100,
                        gainStart: 0.2,
                        gainEnd: 0.15
                    },
                    {
                        type: 'square',
                        freqStart: f(880),
                        freqEnd: f(1760),
                        durationMs: 150,
                        gainStart: 0.2,
                        gainEnd: 0.0
                    }
                ];
            case 'select':
                return [
                    {
                        type: 'triangle',
                        freqStart: f(660),
                        freqEnd: f(880),
                        durationMs: 60,
                        gainStart: 0.2,
                        gainEnd: 0.0
                    }
                ];
            case 'error':
                return [
                    { type: 'square', freqStart: f(200), durationMs: 100, gainStart: 0.25, gainEnd: 0.2 },
                    { type: 'square', freqStart: f(150), durationMs: 120, gainStart: 0.25, gainEnd: 0.0 }
                ];
            case 'win':
                return [
                    { type: 'square', freqStart: f(523), durationMs: 100, gainStart: 0.2, gainEnd: 0.15 },
                    { type: 'square', freqStart: f(659), durationMs: 100, gainStart: 0.2, gainEnd: 0.15 },
                    { type: 'square', freqStart: f(784), durationMs: 200, gainStart: 0.2, gainEnd: 0.0 }
                ];
            case 'lose':
                return [
                    { type: 'sawtooth', freqStart: f(392), durationMs: 150, gainStart: 0.2, gainEnd: 0.15 },
                    { type: 'sawtooth', freqStart: f(311), durationMs: 150, gainStart: 0.2, gainEnd: 0.15 },
                    { type: 'sawtooth', freqStart: f(233), durationMs: 250, gainStart: 0.2, gainEnd: 0.0 }
                ];
            default:
                return [{ type: 'sine', freqStart: f(440), durationMs: 100, gainStart: 0.2, gainEnd: 0.0 }];
        }
    }
}

export const SfxSynth = new SfxSynthImpl();
export default SfxSynth;
