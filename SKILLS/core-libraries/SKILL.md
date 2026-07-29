# Skill: core-libraries

## Cuándo usar esta skill

Cada vez que vayas a resolver un problema genérico de gamedev (input, audio,
guardado, i18n, UI, pooling, transiciones, debug) en un juego generado desde
`templates/phaser-starter/`. **Antes de escribir esa lógica desde cero,
revisa si ya existe en `src/core/` — no la reimplementes por juego.**

Esta skill documenta qué hay disponible, cuándo usar cada pieza, y cuándo
NO usarla (para no forzar una librería genérica donde el juego necesita algo
muy específico).

## Inventario de `src/core/`

| Módulo | Resuelve | No lo uses para |
|---|---|---|
| `EventBus.js` | Comunicación desacoplada entre sistemas (input → gameplay → UI) | Datos que otra escena necesita *leer* después (usa `this.registry`) |
| `AudioManager.js` | Buses de música/sfx, reactividad a `isAudioEnabled` | Audio posicional 3D complejo (implementación custom aparte) |
| `SfxSynth.ts` | SFX de UI/gameplay generados proceduralmente (sin archivos) | Música, o sonidos con carácter orgánico específico — ver `SKILLS/asset-pipeline/SKILL.md` |
| `SaveManager.js` | Progreso persistente con versión de esquema y migraciones | Datos efímeros de una sola partida (usa `this.registry` o estado de escena) |
| `Localization.js` | Textos de UI en el idioma del usuario de YouTube | Contenido narrativo extenso (diálogos largos) — ahí evalúa una solución de i18n más completa |
| `InputManager.js` | Gestos semánticos (tap/hold/drag/swipe) sobre puntero unificado | Multi-touch simultáneo complejo (varios dedos a la vez) — Phaser expone pointers múltiples directamente, este manager asume un puntero primario |
| `ObjectPool.js` | Reciclar objetos efímeros (balas, partículas, enemigos) en juegos de acción | Objetos que existen una sola vez por partida (jefes, UI) |
| `UIKit.js` | Button, Panel, ProgressBar responsivos | UI muy específica de un juego (ej. un tablero de ajedrez) — construir a medida, no forzar estos componentes |
| `SceneTransitions.js` | Fade entre escenas | Transiciones complejas tipo wipe/mask — implementar aparte si el diseño lo pide |
| `StateMachine.ts` | Estados discretos (IA de enemigos, fases de personaje, flujo de una escena) | Lógica continua (física, movimiento analógico) — eso no es una FSM |
| `Juice.ts` | Screen shake, hit-stop, texto flotante, pop de escala — feedback visual barato de alto impacto | Animaciones narrativas largas o cinemáticas — usa tweens/timelines directos de Phaser |
| `LevelLoader.ts` | Cargar/validar niveles data-driven en JSON | Contenido que cambia por código (lógica de gameplay), no por datos |
| `ShapeSprites.ts` | Texturas procedurales simples (círculo, estrella, gradiente, dot) sin archivos de imagen | Arte detallado/orgánico — ahí se necesita un artista o asset real |
| `ParticlePresets.ts` | Confetti, chispas, humo, polvo de impacto — usando texturas de ShapeSprites | Sistemas de partículas muy custom del gameplay específico |
| `UIOverlays.ts` | Modal, Toast, PauseMenu listos para usar | UI persistente del HUD principal (eso vive en la propia escena) |
| `Accessibility.ts` | Paleta segura para daltonismo, validación de tamaño táctil mínimo | Auditoría de accesibilidad completa (WCAG) — esto es un mínimo, no un reemplazo |
| `PerformanceMonitor.ts` | Detectar FPS bajo y exponer nivel de calidad adaptativo | Profiling detallado (memoria, GC) — usa DevTools para eso |
| `PhysicsHelpers.ts` | Patrones de Arcade Physics: plataformeros, lanzamiento de proyectiles, aceleración | Física compleja (cuerpos suaves, telas, restricciones) — eso requiere Matter.js directo, no este helper |
| `GridUtils.ts` | Coordenadas grid↔mundo, vecinos, pathfinding BFS — juegos de tablero/tiles | Grids enormes con costos de movimiento variables — ahí hace falta A* con pesos, no BFS |
| `DebugOverlay.js` | FPS + estado del SDK, solo en dev | Nunca en build de producción — ver más abajo |

## Cobertura de géneros: este SDK no está limitado a los 4 templates

Los templates (`phaser-starter`, `puzzle-starter`, `runner-starter`,
`idle-starter`) y el showcase (`examples/showcase-dodger`) son **ejemplos**,
no el límite del SDK. Las librerías de `core/` son genéricas y cualquier
juego 2D en Phaser se construye combinándolas. Tabla de referencia rápida
para géneros que no tienen un template dedicado:

| Arquetipo de juego | Sistemas a combinar |
|---|---|
| Plataformero | `PhysicsHelpers` (setupPlatformerBody, isGrounded) + `InputManager` + `StateMachine` (idle/running/jumping) |
| Lanzamiento de proyectiles (Angry Birds-like) | `PhysicsHelpers` (angleBetween, velocityFromAngle) + `InputManager` (drag para apuntar) + `ObjectPool` |
| Tower defense / estrategia en grid | `GridUtils` (gridToWorld, getNeighbors, findPathBFS) + `ObjectPool` + `SaveManager` |
| Juego de mesa (damas, tres en raya, etc.) | `GridUtils` + `StateMachine` (turno jugador/rival) + `UIOverlays` (Modal para fin de partida) |
| Trivia/quiz | `LevelLoader` (banco de preguntas en JSON) + `UIKit` (Button por opción) + `SaveManager` |
| Rompecabezas de tiles (sliding puzzle, etc.) | `GridUtils` + `InputManager` (tap/drag) + `Juice` (popScale al colocar pieza) |
| Rítmico / timing | `InputManager` (tap con ventana de tiempo) + `SfxSynth` + `Juice` (floatingText de "perfecto/bien/fallo") |
| Shooting gallery / bullet-hell | `ObjectPool` (proyectiles) + `PhysicsHelpers` (velocityFromAngle) + `ParticlePresets` |

Si un agente encuentra un género que genuinamente necesita un sistema que no
existe en `core/`, la respuesta es **agregar un módulo nuevo siguiendo el
mismo patrón** (ver `CONTRIBUTING.md`), no forzar el género en un sistema
que no encaja.

## Reglas de uso

1. **Un solo `AudioManager`, un solo `Localization`, por juego.** Son
   singletons (se exportan como instancia ya creada). No los instancies de
   nuevo — impórtalos donde los necesites.
2. **`SaveManager` se crea una vez en `Boot.js`** (ver la constante
   `saveManager` exportada ahí) y se importa desde donde se necesite leer o
   escribir progreso (ej. `GameOver.js`). No crees una segunda instancia con
   `createSaveManager` en otra escena — fragmentarías el guardado.
3. **`InputManager.attach(scene)` se llama una vez por escena de gameplay**,
   típicamente en `create()`, y debe desconectarse solo (ya lo hace vía el
   evento `shutdown` de la escena) — no dupliques la limpieza manualmente.
4. **`DebugOverlay` solo se activa con `import.meta.env.DEV`.** Nunca lo
   actives incondicionalmente ni lo dejes en una rama de código que corra en
   producción — rompe la estética del juego publicado y puede filtrar
   información de debug a los usuarios finales.
5. **Al agregar un módulo core nuevo** (por ejemplo, un sistema de logros o
   un gestor de partículas más avanzado), colócalo en `src/core/`, documenta
   su contrato con el mismo formato de comentario de cabecera que los
   módulos existentes, y añade una fila a la tabla de arriba.

## Ejemplo de composición típica en una escena de gameplay

```js
import { InputManager } from '../core/InputManager.js';
import { EventBus } from '../core/EventBus.js';
import { AudioManager } from '../core/AudioManager.js';
import { createObjectPool } from '../core/ObjectPool.js';

// En create():
InputManager.attach(this);
EventBus.on('input:tap', ({ x, y }) => {
    AudioManager.playSfx('tap');
    const bullet = bulletPool.acquire(x, y);
});
```

## Checklist antes de dar por resuelta una feature "genérica"

- [ ] ¿Ya existe un módulo en `src/core/` que resuelve esto? Si sí, úsalo en
      vez de reescribirlo.
- [ ] ¿Es realmente genérico (aplica a cualquier género de juego) o es
      específico de este juego? Si es específico, no lo fuerces dentro de
      `src/core/` — vive en el propio juego.
- [ ] Si creaste un módulo nuevo en `src/core/`, ¿está documentado en la
      tabla de este archivo?
