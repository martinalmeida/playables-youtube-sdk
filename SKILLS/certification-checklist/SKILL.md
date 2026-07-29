# Skill: certification-checklist

## Cuándo usar esta skill

Cuando el usuario diga que el juego está "listo", "terminado", o pida
prepararlo para "enviar", "publicar" o "subir al portal". Es el último paso
antes de entregar el juego como completo.

## Checklist de salida (recorre todas las skills anteriores)

### Integración SDK (`playables-sdk-integration`)
- [ ] Boot espera DOM + SDK antes de instanciar el motor.
- [ ] `firstFrameReady()` y `gameReady()` se disparan en el orden y momento
      correctos.
- [ ] `onPause` pausa todo y guarda progreso; `onResume` solo reanuda.
- [ ] No hay ningún uso de Page Visibility API en el código.
- [ ] `sendScore` se llama una vez al final de cada partida.

### Diseño responsive (`responsive-design`)
- [ ] Probado en al menos 9:16, 1:1 y 16:9 sin recargar la página.
- [ ] Ningún elemento interactivo crítico queda fuera de zona segura en
      relaciones de aspecto extremas.

### Assets (`asset-pipeline`)
- [ ] Miniatura 1:1 ≥512×512, con título, sin logos, respetando zona segura
      del 12%.
- [ ] Video de preview 16:9 ≥1280×720.
- [ ] Descripción ≤150 caracteres, sin branding.
- [ ] Título ≤50 caracteres.
- [ ] Bundle final auditado en tamaño (`npm run build`).

### Validación técnica final
- [ ] `npm run build` genera un `dist/` sin errores.
- [ ] El juego corrido desde `dist/` (no desde `npm run dev`) funciona igual.
- [ ] Verificado contra el Test Suite oficial:
      `https://developers.google.com/youtube/gaming/playables/test_suite`
      apuntando al servidor local o al build servido estáticamente.

## Qué hacer si algo falla

No "arregles" saltándote un requisito de certificación aunque el usuario
tenga prisa (ej. no elimines el guardado en `onPause` para simplificar). Si
un requisito genuinamente no aplica al juego (ej. el juego no usa audio),
decláralo explícitamente en el reporte al usuario en vez de omitirlo en
silencio.

## Entregable de esta skill

Al completar este checklist, produce un resumen corto para el usuario con:
1. Estado de cada bloque (✅/⚠️/❌).
2. Ruta al `dist/` final.
3. Ruta a `store-assets/` con el material de publicación.
4. Recordatorio de que el acceso al Developer Portal de Playables requiere
   estar en el programa de acceso anticipado (formulario de interés oficial)
   y permisos de administrador del canal de YouTube asociado.
