# Playables Agent SDK

Un meta-framework para construir minijuegos de **YouTube Playables** con
tecnologías web (JS/HTML, motor Phaser 3 por defecto), pensado desde el
diseño para ser operado por **agentes de codificación con IA** (Claude Code,
Codex, OpenCode, u otros compatibles con el formato `AGENTS.md` / skills).

## Empezar aquí

Si eres un agente de IA, lee primero **[`AGENTS.md`](./AGENTS.md)** — es el
contrato de comportamiento completo para este repo. Todo lo demás (skills,
templates, scripts) está referenciado desde ahí.

Si eres una persona:

```bash
# Crear un juego nuevo a partir de un template
node scripts/new-game.mjs --name mi-juego --title "Mi Juego" \
  --description "Un puzzle rápido de 30 segundos" \
  --template phaser-starter   # o: puzzle-starter | runner-starter | idle-starter

cd games/mi-juego
npm install
npm run dev           # http://localhost:8080
npm run agent-check   # typecheck + lint + validate + build, todo en uno
```

## Templates disponibles

| Template | Qué demuestra |
|---|---|
| `phaser-starter` | Base genérica: Boot/Preloader/MainMenu/Game/GameOver + todas las core libs |
| `puzzle-starter` | Memoria/parejas data-driven (`LevelLoader` + `StateMachine`) |
| `runner-starter` | Endless runner (`ObjectPool` + `InputManager` swipe + `StateMachine`) |
| `idle-starter` | Clicker con progreso offline (`SaveManager` + `ProgressBar`) |

## Juego de referencia (few-shot completo)

`examples/showcase-dodger/` es un juego **real y jugable** ("Meteor
Dodger") que combina *todos* los sistemas del SDK en un solo lugar — el
mejor punto de partida para que un agente vea el patrón de composición
completo antes de generar un juego nuevo:

- `InputManager` (drag para mover la nave) + `EventBus`
- `ObjectPool` (meteoros y monedas reciclados)
- `StateMachine` (estado vivo/muerto del jugador)
- `ShapeSprites` + `ParticlePresets` (sprites y partículas 100% procedurales)
- `SfxSynth` vía `AudioManager.playSynth()` (sonido sin archivos)
- `Juice` (screen shake, hit-stop, texto flotante, pop de escala)
- `LevelLoader` (dificultad data-driven en JSON)
- `PerformanceMonitor` (reduce partículas automáticamente en FPS bajo)
- `UIOverlays` (menú de pausa) + `Accessibility` (paleta segura, chequeo de touch target)
- `SaveManager` (mejor puntaje persistente)

```bash
cd examples/showcase-dodger
npm install
npm run dev
npm run agent-check
```

## Estructura del repo

```
playables-agent-sdk/
├── AGENTS.md                     # Contrato para agentes de IA (léelo primero)
├── docs/
│   └── sdk-reference.md          # Referencia condensada de la API ytgame.*
├── SKILLS/                       # Una carpeta por skill, cada una con SKILL.md
│   ├── playables-sdk-integration/
│   ├── phaser-scene-scaffolding/
│   ├── responsive-design/
│   ├── asset-pipeline/
│   ├── core-libraries/
│   └── certification-checklist/
├── templates/
│   └── phaser-starter/           # Template funcional: Phaser 3 + Vite + SDK wrapper
│       └── src/
│           ├── lib/YouTubePlayables.js   # Wrapper de bajo nivel sobre ytgame.*
│           ├── core/                     # Librerías genéricas reutilizables:
│           │                             #   EventBus, AudioManager, SaveManager,
│           │                             #   Localization, InputManager, ObjectPool,
│           │                             #   UIKit, SceneTransitions, DebugOverlay
│           └── scenes/                   # Boot → Preloader → MainMenu → Game → GameOver
├── scripts/
│   └── new-game.mjs              # Generador de juegos nuevos
└── games/                        # (se crea al generar el primer juego)
```

## Por qué Phaser + Vite por defecto

YouTube Playables admite cualquier motor que exporte a la Web con una
API de renderizado estándar (WebGL/Canvas) — Phaser, PixiJS, Construct,
Godot y Unity han sido usados en producción. Este scaffold usa **Phaser 3**
como motor por defecto porque tiene el soporte oficial más maduro (template y
tutorial publicados por el propio equipo de Phaser en conjunto con Google), y
porque encaja de forma natural con desarrolladores que ya vienen de JS/HTML,
sin curva de aprendizaje de un motor nuevo tipo Unity/C#.

Si necesitas otro motor, la estructura de `SKILLS/` está pensada para que un
agente pueda crear una skill equivalente (`SKILLS/pixi-scene-scaffolding/`,
por ejemplo) sin romper el resto del contrato de `AGENTS.md`.

## Qué NO incluye este repo (todavía)

- Acceso automatizado al Developer Portal de Playables: eso requiere estar
  en el programa de acceso anticipado de Google (formulario de interés) y
  permisos de administrador sobre un canal de YouTube. Es un paso manual,
  fuera del alcance de este scaffold.
- Soporte de motores distintos a Phaser (ver sección anterior).
- CI/CD para build y despliegue automático — se puede agregar como skill
  nueva si el flujo del usuario lo requiere.

## Referencias oficiales

- Documentación del SDK: https://developers.google.com/youtube/gaming/playables/reference/sdk
- Test Suite: https://developers.google.com/youtube/gaming/playables/test_suite
- Requisitos de diseño: https://developers.google.com/youtube/gaming/playables/certification/requirements_design
- Requisitos de integración: https://developers.google.com/youtube/gaming/playables/certification/requirements_integration
- Formulario de interés / acceso anticipado: portal de desarrolladores de
  Playables en Google for Developers.
