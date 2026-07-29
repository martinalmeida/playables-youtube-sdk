# AGENTS.md — Guía operativa para agentes de IA

Este repositorio es un **meta-SDK** para construir minijuegos de **YouTube Playables**
usando agentes de codificación autónomos (Claude Code, Codex, OpenCode, o cualquier
agente compatible con este formato). Si eres un agente y estás leyendo esto, este
archivo es tu fuente de verdad sobre cómo operar aquí. Léelo completo antes de tocar
código.

## 1. Qué es este repo (y qué NO es)

- Esto **no es un juego**. Es un generador/andamiaje (scaffold) + conjunto de skills
  para producir juegos individuales que cumplen los requisitos de YouTube Playables.
- Cada juego real vive en `games/<nombre-del-juego>/`, generado con
  `node scripts/new-game.mjs --name <nombre> --template <template>`. Templates
  disponibles: `phaser-starter` (base genérica), `puzzle-starter` (memoria/parejas,
  data-driven con LevelLoader), `runner-starter` (endless runner con ObjectPool),
  `idle-starter` (clicker con progreso offline). Nunca mezcles código de un juego
  con el del scaffold.
- `examples/showcase-dodger/` es distinto de `games/`: es un juego de
  referencia **permanente y versionado**, no desechable, que demuestra todos
  los sistemas del core funcionando juntos. Consúltalo como "few-shot" antes
  de escribir gameplay nuevo — no lo borres ni lo trates como scratch space.
- El motor por defecto es **Phaser 3** (JS/HTML puro, WebGL/Canvas), porque es el
  motor con mejor soporte oficial para Playables. Si el usuario pide otro motor
  (PixiJS, Construct, Godot), consulta `SKILLS/` — puede que falte esa skill y haya
  que crearla siguiendo el mismo patrón.

## 1.1. Este SDK no está limitado a un tipo de juego

Los templates y el showcase son ejemplos de género, no el límite del SDK.
Antes de asumir que un género "no está soportado", revisa la tabla de
cobertura de géneros en `SKILLS/core-libraries/SKILL.md` — cubre
plataformeros, lanzamiento de proyectiles, tower defense, juegos de mesa,
trivia, puzzles de tiles, rítmicos, y shooting gallery combinando los
sistemas de `core/` existentes. Si un juego pedido genuinamente necesita
algo que no existe (ver `PhysicsHelpers.ts`, `GridUtils.ts` para los casos
ya cubiertos), la respuesta es agregar un módulo nuevo al `core/` siguiendo
el patrón existente (ver `CONTRIBUTING.md`), no forzarlo en un template que
no encaja ni decirle al usuario que no es posible.

## 2. Orden de lectura obligatorio antes de generar o editar un juego

1. Este archivo (`AGENTS.md`).
2. `docs/sdk-reference.md` — referencia condensada de la API real `ytgame.*`.
3. Cada `SKILLS/<skill>/SKILL.md` relevante a la tarea (ver tabla abajo).
4. `templates/phaser-starter/` completo, especialmente
   `src/lib/YouTubePlayables.js`, `src/core/*.js` y `src/scenes/*.js`.

No generes código de integración con el SDK "de memoria". Todo el ciclo de vida
(`firstFrameReady`, `gameReady`, `onPause`/`onResume`, `saveData`/`loadData`,
`sendScore`) está ya resuelto en el wrapper del template — reutilízalo, no lo
reinventes por juego.

## 3. Tabla de skills disponibles

| Cuándo se activa | Skill |
|---|---|
| Vas a integrar o tocar el ciclo de vida del SDK de Playables (pause/resume, ready, score, save) | `SKILLS/playables-sdk-integration/SKILL.md` |
| Vas a crear o modificar escenas de Phaser (Boot, Preloader, MainMenu, Game, GameOver) | `SKILLS/phaser-scene-scaffolding/SKILL.md` |
| Vas a definir layout, canvas, UI o cualquier cosa visual | `SKILLS/responsive-design/SKILL.md` |
| Vas a agregar imágenes, audio, spritesheets o video de preview | `SKILLS/asset-pipeline/SKILL.md` |
| Vas a resolver input, audio, guardado, i18n, UI, pooling, FSM, juice, niveles, sprites/partículas procedurales o performance adaptativo | `SKILLS/core-libraries/SKILL.md` |
| Vas a elegir colores de estado, tamaños táctiles, o feedback que dependa de audio | `SKILLS/accessibility/SKILL.md` |
| El juego está "terminado" y hay que prepararlo para envío/certificación | `SKILLS/certification-checklist/SKILL.md` |

## 3.2. Verificación E2E y miniaturas automáticas

Además de `agent-check` (rápido, sin navegador real), cada template trae:

```bash
npx playwright install chromium   # una sola vez
npm run test:e2e                  # abre el juego en Chromium real, valida que no haya errores de consola
node ../../scripts/capture-thumbnail.mjs .   # captura una miniatura base 512x512 desde MainMenu
```

`test:e2e` es más lento que `agent-check` (levanta un navegador real) y por
eso **no** está incluido dentro de `agent-check` — córrelo como paso final
antes de dar un juego por certificable, no en cada iteración de desarrollo.

## 3.1. Herramientas de verificación automática

Todo template (`phaser-starter`, `puzzle-starter`, `runner-starter`,
`idle-starter`) está en **TypeScript** y trae:

```bash
npm run typecheck    # tsc --noEmit
npm run lint          # eslint (incluye regla que bloquea Page Visibility API)
npm run test          # vitest — suite de unit tests de src/core/
npm run format:check  # prettier --check
npm run validate      # scripts/validate-game.mjs — checklist de certificación como código
npm run agent-check   # typecheck + lint + test + validate + build, en un solo comando
```

**Corre siempre `npm run agent-check` antes de decir que un juego está
"listo"** — no te bases solo en la skill `certification-checklist` leída,
verifícalo con la herramienta. En desarrollo (`npm run dev`), si no hay un
`ytgame` real disponible, se instala automáticamente un mock
(`src/dev/mockYtGame.ts`) que simula el SDK — atajos `P` (pausar/reanudar) y
`M` (alternar audio) para probar el ciclo de vida sin el Test Suite oficial.

## 4. Flujo estándar para crear un juego nuevo

```bash
node scripts/new-game.mjs --name mi-juego --genre puzzle
cd games/mi-juego
npm install
npm run dev   # http://localhost:8080
```

Esto clona `templates/phaser-starter/` a `games/mi-juego/`, sustituye placeholders
de nombre/título, y deja el wrapper del SDK ya cableado.

## 5. Reglas duras (no negociables)

Estas reglas existen porque violarlas hace que YouTube **rechace la certificación**
del juego. Un agente nunca debe generar código que las rompa, ni aunque el usuario
lo pida sin saberlo — en ese caso, avisa al usuario en vez de aplicar el cambio.

1. **Nunca uses `document.visibilityState` ni la Page Visibility API.** El pausado
   del juego SOLO se maneja vía `onPause`/`onResume` del SDK. Ver
   `SKILLS/playables-sdk-integration/SKILL.md`.
2. **`gameReady()` solo se llama cuando el usuario ya puede interactuar** (menú
   principal cargado, no antes). `firstFrameReady()` se llama en cuanto se ve el
   primer frame/pantalla de carga, no después.
3. **El juego debe ser 100% responsive**: debe jugarse en relaciones de aspecto
   desde 9:16 hasta 21:9 y ocupar todo el viewport disponible. No hardcodees
   dimensiones de canvas fijas.
4. **Guarda el progreso del usuario en `onPause`**, siempre. Nunca asumas que habrá
   un cierre "limpio" del juego.
5. **Todo el output final debe ser un bundle estático** (HTML+JS+CSS+assets) sin
   dependencias de servidor. `npm run build` es la única forma válida de generar
   el artefacto a subir al Developer Portal.
6. **No agregues logos ni branding en miniaturas/descripciones** — es un requisito
   de certificación, ver `SKILLS/certification-checklist/SKILL.md`.

## 6. Convenciones de commits / cambios (para agentes autónomos)

- Un cambio = un juego o un cambio de scaffold, nunca ambos en el mismo commit.
- Si modificas `templates/phaser-starter/`, NO propagues el cambio automáticamente
  a juegos ya generados en `games/`. Repórtalo al usuario; la migración es manual.
- Si creas una skill nueva, sigue el formato exacto de las existentes (ver
  cualquier `SKILL.md` como plantilla) y regístrala en la tabla de la sección 3.

## 7. Cuándo preguntar al usuario en vez de asumir

- Motor de juego distinto a Phaser.
- Monetización, anuncios o cualquier integración fuera del SDK oficial de
  Playables (no documentada, no soportarla sin confirmar).
- Cambios que afecten a `games/` existentes por un cambio en el scaffold.

Todo lo demás (estructura de escenas, nombres de archivos, convenciones de código)
síguelo de los templates sin preguntar.
