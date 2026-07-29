/**
 * Localization.ts — i18n mínimo con auto-detección del idioma vía SDK.
 */
import { YouTubePlayables } from '../lib/YouTubePlayables';

type Dictionary = Record<string, string>;

class LocalizationImpl {
    private dictionaries: Record<string, Dictionary> = {};
    private currentLang = 'en';
    private fallbackLang = 'en';

    registerDictionary(langCode: string, dictionary: Dictionary): void {
        this.dictionaries[langCode] = { ...(this.dictionaries[langCode] || {}), ...dictionary };
    }

    setFallbackLanguage(langCode: string): void {
        this.fallbackLang = langCode;
    }

    setLanguage(langCode: string): void {
        this.currentLang = langCode;
    }

    async autoDetect(): Promise<string> {
        try {
            const lang = await YouTubePlayables.loadLanguage();
            const normalized = (lang || '').split('-')[0];

            if (this.dictionaries[normalized]) {
                this.currentLang = normalized;
            } else {
                console.warn(
                    `[Localization] No hay diccionario para "${normalized}", usando fallback "${this.fallbackLang}".`
                );
                this.currentLang = this.fallbackLang;
            }
        } catch (err) {
            console.error('[Localization] No se pudo detectar el idioma:', err);
            this.currentLang = this.fallbackLang;
        }

        return this.currentLang;
    }

    t(key: string): string {
        const dict = this.dictionaries[this.currentLang];
        if (dict && key in dict) return dict[key];

        const fallbackDict = this.dictionaries[this.fallbackLang];
        if (fallbackDict && key in fallbackDict) return fallbackDict[key];

        return `[${key}]`;
    }
}

export const Localization = new LocalizationImpl();
export default Localization;
