// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Reglas custom pensadas específicamente para no romper certificación de
 * Playables. Ver SKILLS/playables-sdk-integration/SKILL.md y
 * SKILLS/certification-checklist/SKILL.md — esto convierte parte de esas
 * reglas en errores de lint automáticos, en vez de depender de que el
 * agente se acuerde de leerlas.
 */
export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            'no-restricted-properties': [
                'error',
                {
                    object: 'document',
                    property: 'visibilityState',
                    message:
                        'Prohibido: usa YouTubePlayables (onPause/onResume del SDK), no Page Visibility API. Ver SKILLS/playables-sdk-integration/SKILL.md.'
                }
            ],
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        "CallExpression[callee.property.name='addEventListener'] Literal[value='visibilitychange']",
                    message:
                        'Prohibido: no escuches "visibilitychange", usa YouTubePlayables.setOnPause/setOnResume. Ver SKILLS/playables-sdk-integration/SKILL.md.'
                }
            ]
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**']
    }
);
