/**
 * AudioManager.ts — buses de música/sfx, reactivo al estado de audio del
 * reproductor de YouTube. Ver SKILLS/core-libraries/SKILL.md.
 */
import type Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';
import { SfxSynth, SfxPreset } from './SfxSynth';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

class AudioManagerImpl {
    private scene: Phaser.Scene | null = null;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private musicVolume = 0.6;
    private sfxVolume = 1.0;
    private globallyMuted = false;

    init(scene: Phaser.Scene): void {
        this.scene = scene;
        this.globallyMuted = !YouTubePlayables.isAudioEnabled();
        this.applyMute();

        YouTubePlayables.setAudioChangeCallback((enabled) => {
            this.globallyMuted = !enabled;
            this.applyMute();
        });
    }

    private applyMute(): void {
        this.scene?.sound.setMute(this.globallyMuted);
        SfxSynth.setMuted(this.globallyMuted);
    }

    /**
     * Efecto sintetizado (sin archivo de audio) — ver SfxSynth.ts. Útil
     * para prototipar sin depender de assets, o como fallback permanente en
     * juegos simples. Respeta el mismo mute global que playSfx().
     */
    playSynth(preset: SfxPreset): void {
        SfxSynth.play(preset);
    }

    playMusic(key: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
        if (!this.scene) return;

        this.currentMusic?.stop();
        this.currentMusic = this.scene.sound.add(key, {
            loop: true,
            volume: this.musicVolume,
            ...config
        });
        this.currentMusic.play();
    }

    stopMusic(): void {
        this.currentMusic?.stop();
        this.currentMusic = null;
    }

    playSfx(key: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
        this.scene?.sound.play(key, { volume: this.sfxVolume, ...config });
    }

    setMusicVolume(value: number): void {
        this.musicVolume = clamp(value, 0, 1);
        (this.currentMusic as Phaser.Sound.WebAudioSound | null)?.setVolume?.(this.musicVolume);
    }

    setSfxVolume(value: number): void {
        this.sfxVolume = clamp(value, 0, 1);
        SfxSynth.setVolume(this.sfxVolume);
    }
}

export const AudioManager = new AudioManagerImpl();
export default AudioManager;
