# Skill: phaser-scene-scaffolding

## Cuándo usar esta skill

Al crear un juego nuevo o agregar/modificar escenas de Phaser dentro de
`games/<nombre>/src/scenes/`.

## Estructura estándar de escenas (no te desvíes sin razón)

```
Boot        → inicializa YouTubePlayables, carga datos guardados, registra
              handlers globales de pause/resume y de audio.
Preloader   → carga todos los assets; llama firstFrameReady() en cuanto hay
              algo visible (barra de carga, logo, etc).
MainMenu    → UI de inicio; llama gameReady() al entrar (o al terminar de
              construirse el menú).
Game        → gameplay real. Aquí vive la lógica específica del juego.
GameOver    → pantalla de fin; llama sendScore() y saveData() con el
              resultado final antes de ofrecer "reintentar"/"menú".
```

Cada juego puede añadir escenas intermedias (selección de nivel, tienda,
tutorial) pero **Boot → Preloader → MainMenu → GameOver siempre existen** y
siempre llaman a los hooks del SDK en el punto indicado.

## Reglas de implementación

1. Una escena, un archivo. No metas lógica de `Game` dentro de `MainMenu`.
2. Toda comunicación entre escenas de datos persistentes (puntaje, nivel
   alcanzado, config de audio) va por `this.registry`, no por variables
   globales sueltas ni `window.*`.
3. La escena `Game` no debe llamar directamente a `ytgame.*` ni al wrapper
   del SDK salvo para `sendScore`/`saveData` al finalizar — toda la
   integración de ciclo de vida (pause/resume/ready) vive en `Boot` y
   `Preloader`, centralizada, no repartida por todas las escenas.
4. Nombres de archivo en PascalCase: `Boot.js`, `Preloader.js`, `MainMenu.js`,
   `Game.js`, `GameOver.js`. Clases con el mismo nombre que el archivo.

## Cuándo crear una escena nueva vs. reusar una existente

- ¿Es un estado de flujo distinto (pantalla completa, distinta interacción)?
  → escena nueva.
- ¿Es solo una variación visual del mismo estado (ej. distintos niveles con
  la misma mecánica)? → misma escena `Game`, parametrizada por datos que le
  pasas al iniciarla (`this.scene.start('Game', { level: 3 })`), no una
  escena por nivel.

## Checklist antes de dar una escena por terminada

- [ ] ¿Vive en su propio archivo con el nombre correcto?
- [ ] ¿Usa `this.registry` para cualquier dato que otra escena necesite leer?
- [ ] ¿Respeta el punto del ciclo de vida del SDK que le corresponde (si
      aplica)? Ver `SKILLS/playables-sdk-integration/SKILL.md`.
- [ ] ¿El layout se calcula desde `this.scale.width/height` y no con números
      fijos? Ver `SKILLS/responsive-design/SKILL.md`.
