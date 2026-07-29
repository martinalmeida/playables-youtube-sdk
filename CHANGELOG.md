# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/).

## [0.5.0] — Cobertura explícita de géneros

### Añadido
- `PhysicsHelpers.ts`: patrones de Arcade Physics para plataformeros (gravedad, drag, isGrounded) y lanzamiento de proyectiles (angleBetween, velocityFromAngle).
- `GridUtils.ts`: coordenadas grid↔mundo, vecinos 4/8-direccionales, pathfinding BFS — para juegos de tablero, tower defense, puzzles de tiles.
- Tests unitarios `GridUtils.test.ts` (6 tests, 31 totales por template).
- Tabla explícita de "cobertura de géneros" en `SKILLS/core-libraries/SKILL.md` y sección 1.1 en `AGENTS.md`: el SDK no está limitado a los 4 templates/showcase existentes — mapea arquetipos de juego (plataformero, proyectiles, tower defense, tablero, trivia, tiles, rítmico, bullet-hell) a combinaciones de sistemas de `core/`.

## [0.4.0] — Kit visual, UI avanzada, accesibilidad, performance, E2E

### Añadido
- `ShapeSprites.ts`: texturas procedurales (círculo, estrella, gradiente, dot) sin archivos de imagen.
- `ParticlePresets.ts`: confetti, chispas, humo, polvo de impacto — sobre texturas de ShapeSprites.
- `UIOverlays.ts`: Modal, Toast, PauseMenu reutilizables.
- `Accessibility.ts` + skill `SKILLS/accessibility/SKILL.md`: paleta segura para daltonismo, validación de tamaño táctil mínimo, regla de feedback visual redundante al audio.
- `PerformanceMonitor.ts`: detección de FPS bajo y nivel de calidad adaptativo vía EventBus.
- Tests unitarios nuevos: `Accessibility.test.ts`, `PerformanceMonitor.test.ts` (25 tests totales por template).
- Playwright: smoke test E2E (`tests/e2e/smoke.spec.ts`) + `scripts/capture-thumbnail.mjs` (miniatura automática 512x512 desde MainMenu). Integrado en CI (no en `agent-check`, por ser más lento).
- `examples/showcase-dodger/`: juego de referencia permanente ("Meteor Dodger") que combina todos los sistemas del SDK — el "few-shot" definitivo para agentes.

## [0.3.0] — Nivel profesional: audio procedural, testing, tooling

### Añadido
- `SfxSynth.ts`: generador procedural de efectos de sonido vía Web Audio API
  (10 presets: coin, jump, hit, explosion, click, powerup, select, error,
  win, lose). Elimina la necesidad de archivos de audio de terceros con
  licencias inciertas.
- Suite de tests unitarios con Vitest (20 tests) para `EventBus`,
  `StateMachine`, `ObjectPool`, `SaveManager`, `LevelLoader`.
- Prettier (`.prettierrc.json`) + scripts `format`/`format:check`.
- `npm run test` integrado en `npm run agent-check`.
- `ARCHITECTURE.md` con diagrama de capas y justificación de decisiones
  de diseño (templates self-contained vs monorepo).
- `CONTRIBUTING.md` con convenciones para agentes que modifiquen el SDK.

### Cambiado
- `AudioManager` ahora expone `playSynth(preset)` como wrapper sobre
  `SfxSynth`, además de los buses de música/sfx basados en assets reales.

## [0.2.0] — TypeScript, validación automática, más templates

### Añadido
- Conversión completa de `phaser-starter` a TypeScript.
- `eslint.config.js` con regla custom que bloquea el uso de
  `document.addEventListener('visibilitychange', ...)`.
- `scripts/validate-game.mjs`: checklist de certificación como código
  ejecutable.
- `src/dev/mockYtGame.ts`: SDK simulado para desarrollo local.
- Sistemas de gameplay: `StateMachine.ts`, `Juice.ts`, `LevelLoader.ts`.
- Tres templates de género nuevos: `puzzle-starter`, `runner-starter`,
  `idle-starter`.
- `.github/workflows/ci.yml`: valida los 4 templates en cada push.
- `--template` en `scripts/new-game.mjs`.

## [0.1.0] — Versión inicial

### Añadido
- `AGENTS.md` y 5 skills (`playables-sdk-integration`,
  `phaser-scene-scaffolding`, `responsive-design`, `asset-pipeline`,
  `certification-checklist`).
- Template Phaser + Vite con wrapper del SDK de Playables (`ytgame.*`).
- Librerías core: `EventBus`, `AudioManager`, `SaveManager`, `Localization`,
  `InputManager`, `ObjectPool`, `UIKit`, `SceneTransitions`, `DebugOverlay`.
- `scripts/new-game.mjs`: generador de juegos nuevos.
