# Referencia rápida — YouTube Playables SDK (`ytgame`)

> Fuente primaria y autoritativa: `https://developers.google.com/youtube/gaming/playables/reference/sdk`
> Este documento es un resumen de trabajo para agentes. Ante cualquier duda o
> comportamiento inesperado, consulta la doc oficial, no este archivo.

El SDK se expone como un objeto global `ytgame` una vez cargado. Se organiza en
namespaces: `ytgame.game`, `ytgame.system`, `ytgame.engagement`.

## Ciclo de vida de arranque

1. Esperar a que el DOM cargue **y** a que `ytgame` esté disponible antes de
   instanciar el motor de juego (Phaser, Pixi, etc). Si no esperas esto, el
   Test Suite oficial marca el juego como no conforme.
2. En cuanto se muestre la primera pantalla visible (loader/splash), invocar
   `ytgame.game.firstFrameReady()`.
3. Cuando el usuario ya puede interactuar (menú principal listo, no antes),
   invocar `ytgame.game.gameReady()`.

## Pausa / reanudación

- `ytgame.system.onPause(callback)` — YouTube puede pausar el juego en
  cualquier momento (usuario minimiza, cambia de video, etc). Al recibir esto:
  detener el loop de juego, audio, timers, llamadas de red y renderizado, y
  **guardar el progreso del usuario**.
- `ytgame.system.onResume(callback)` — reanudar únicamente cuando se llame
  este callback.
- Prohibido usar `document.visibilityState` / Page Visibility API como
  sustituto. Solo estos dos callbacks son válidos.

## Persistencia

- `ytgame.game.saveData(jsonString)` — guarda datos del usuario. El string debe
  ser UTF-16 válido, sin surrogates sueltos.
- `ytgame.game.loadData()` — devuelve una Promise con los datos guardados
  (parsear con `JSON.parse`). Envolver siempre con timeout: en el Test Suite
  y en hot-reload local esta llamada puede quedarse colgada indefinidamente.

## Puntuación / engagement

- `ytgame.engagement.sendScore({ value })` — envía la puntuación final del
  usuario al finalizar una partida.

## Sistema / entorno

- `ytgame.system.getLanguage()` — idioma configurado por el usuario en
  YouTube, para localizar textos del juego.
- `ytgame.system.isAudioEnabled()` — si el reproductor de YouTube tiene el
  audio habilitado en este momento.
- `ytgame.system.onAudioEnabledChange(callback)` — se dispara cuando el
  usuario activa/desactiva el audio del reproductor; el juego debe reaccionar
  (mute/unmute) en tiempo real, no solo leer el estado una vez al inicio.

## Errores comunes que causan rechazo en certificación

| Síntoma | Causa típica |
|---|---|
| El juego no pausa al cambiar de pestaña/minimizar | Usar Page Visibility API en vez de `onPause` |
| El juego se "traba" en la pantalla de carga en el Test Suite | No se llamó `firstFrameReady()` o se colgó `loadData()` sin timeout |
| El usuario pierde el progreso | No se guarda estado dentro del handler de `onPause` |
| Rechazo por diseño no responsive | Canvas con dimensiones fijas en vez de recalcular con el viewport |
| Rechazo por audio | El juego no respeta `isAudioEnabled()` / no escucha `onAudioEnabledChange` |

## Test Suite

`https://developers.google.com/youtube/gaming/playables/test_suite` — permite
apuntar a un servidor local (`http://localhost:8080` con el template de Vite) y
verificar en vivo qué llamadas del SDK se están disparando y en qué orden.
Úsalo siempre antes de dar un juego por "listo para enviar".
