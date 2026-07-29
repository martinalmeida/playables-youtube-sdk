# Skill: responsive-design

## Cuándo usar esta skill

Cualquier tarea que toque layout, posicionamiento de UI, tamaño de canvas,
orientación, o assets visuales que dependan del tamaño de pantalla.

## Requisito no negociable

El juego debe ser jugable en relaciones de aspecto que van desde 9:16
(vertical, móvil) hasta 21:9 (ultra ancho), pasando por 1:1, 4:3, 16:9, etc.,
y debe ocupar siempre toda la ventana de visualización disponible, ajustándose
automáticamente cuando el viewport cambia (no solo al cargar).

## Cómo implementarlo en Phaser

1. **Configuración del `Phaser.Game`**: usar `Scale.RESIZE` o `Scale.FIT` según
   el juego (RESIZE si el gameplay debe reflowar con el viewport; FIT si se
   prefiere letterboxing dentro de una relación de aspecto de diseño). No usar
   un `width`/`height` fijo sin un modo de escalado que lo acompañe.
2. **Nunca hardcodear coordenadas absolutas** para UI crítica (botones,
   marcador, controles). Calcular siempre a partir de
   `this.scale.width`, `this.scale.height`, y anclajes relativos (ej. "10px
   desde el borde derecho", no "x: 750").
3. **Escuchar el evento de resize**: `this.scale.on('resize', callback)` para
   recolocar UI cuando el viewport cambia en caliente (rotación de
   dispositivo, redimensionado de ventana en desktop).
4. **Zonas de seguridad**: evitar poner elementos interactivos críticos muy
   cerca de los bordes extremos — en relaciones de aspecto muy alargadas
   (9:21, 21:9) las esquinas pueden quedar recortadas o tapadas por la UI de
   YouTube.
5. **Assets**: preferir spritesheets vectoriales o de alta resolución con
   escalado, en vez de bitmaps pensados para una sola resolución fija — ver
   `SKILLS/asset-pipeline/SKILL.md`.

## Cómo probarlo

- Chrome DevTools → modo de emulación móvil, probar iPad Pro, un móvil
  angosto (ej. iPhone SE) y una ventana desktop ancha, sin recargar entre
  cambios de tamaño.
- El Test Suite oficial de Playables también permite verificar el
  comportamiento dentro del contexto real de YouTube.

## Checklist

- [ ] ¿El juego usa un modo de escalado de Phaser (`RESIZE`/`FIT`), no un
      canvas de tamaño fijo?
- [ ] ¿La UI se recalcula en el evento `resize`, no solo una vez al inicio?
- [ ] ¿Se probó en al menos 3 relaciones de aspecto distintas (vertical,
      cuadrada, ancha)?
- [ ] ¿Ningún elemento interactivo queda fuera de la zona segura en los
      extremos de relación de aspecto (9:16 / 21:9)?
