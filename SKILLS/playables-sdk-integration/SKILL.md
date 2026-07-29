# Skill: playables-sdk-integration

## Cuándo usar esta skill

Actívala cuando la tarea implique tocar cualquiera de estos puntos en un juego
generado desde `templates/phaser-starter/`:

- El boot inicial del juego (esperar SDK + DOM).
- `firstFrameReady()` / `gameReady()`.
- Pausa/reanudación (`onPause` / `onResume`).
- Guardado/carga de progreso (`saveData` / `loadData`).
- Envío de puntuación (`sendScore`).
- Audio reactivo al estado del reproductor de YouTube.

No uses esta skill para lógica de gameplay pura (física, IA de enemigos,
niveles) — eso es responsabilidad de `phaser-scene-scaffolding`.

## Contrato que debe cumplir cualquier código que toques

1. **Boot**: el juego nunca se instancia antes de que el wrapper confirme que
   el SDK está listo. Ver `src/lib/YouTubePlayables.js#boot`.
2. **firstFrameReady**: se llama en el primer render visible al usuario
   (típicamente en el `init()` o `create()` de la escena `Preloader`), nunca
   antes de que haya algo pintado en pantalla.
3. **gameReady**: se llama únicamente cuando el usuario puede interactuar
   (normalmente al entrar a `MainMenu`). Si el juego salta directo a jugar sin
   menú, se llama al inicio de la escena `Game` en el primer frame jugable.
4. **onPause**: dentro del callback —
   - Pausar el loop de física/animación del motor.
   - Silenciar/pausar audio.
   - Cancelar timers y llamadas de red pendientes si las hay.
   - Guardar el estado actual del usuario con `saveData`.
5. **onResume**: reanudar únicamente lo que se pausó arriba. Nunca reiniciar
   estado — es una reanudación, no un reset.
6. **saveData/loadData**: siempre serializar a JSON string, siempre envolver
   `loadData()` con un timeout (recomendado 1000ms) para evitar cuelgues en
   el Test Suite o en desarrollo con hot-reload.
7. **sendScore**: se llama una sola vez al concluir una partida/nivel, con el
   valor final, no en cada actualización parcial de puntaje.

## Anti-patrones a rechazar activamente

Si ves alguno de estos patrones en el código (propio o de un PR/generación
anterior), corrígelo sin que el usuario tenga que pedirlo explícitamente:

- `document.addEventListener('visibilitychange', ...)` → reemplazar por
  `ytgame.system.onPause` / `onResume`.
- `gameReady()` llamado en el primer `preload()` antes de que exista un menú
  jugable.
- `loadData()` sin `try/catch` ni timeout.
- Guardar el progreso solo en un botón de "salir" en vez de en `onPause`
  (el usuario puede cerrar el juego de formas que no disparan ese botón).

## Checklist de verificación rápida

- [ ] `YouTubePlayables.boot()` envuelve la instanciación del motor de juego.
- [ ] `firstFrameReady()` se dispara antes que `gameReady()`, y `gameReady()`
      antes de cualquier input del jugador.
- [ ] `onPause` guarda datos Y pausa todo lo audible/animado.
- [ ] `onResume` no reinicia nada, solo reanuda.
- [ ] Probado contra el Test Suite oficial
      (`https://developers.google.com/youtube/gaming/playables/test_suite`)
      apuntando a `http://localhost:8080`.
