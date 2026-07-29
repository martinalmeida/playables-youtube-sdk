# Skill: accessibility

## Cuándo usar esta skill

Al elegir colores para estados de juego (éxito/error/advertencia), al
definir tamaños de botones/elementos táctiles, o al decidir si un feedback
importante depende del sonido.

## Reglas

1. **Ningún feedback crítico depende solo del audio.** Como
   `isAudioEnabled()` puede ser `false` en cualquier momento (el usuario
   puede tener el reproductor de YouTube muteado), todo evento importante
   (impacto, error, victoria, derrota) necesita una señal visual equivalente
   — no basta con un sonido. Ver `Juice.ts` (floatingText, screenShake)
   como el complemento visual habitual de `SfxSynth.play(...)`.
2. **Usa `Accessibility.A11Y_PALETTE` para estados**, no rojo/verde puro.
   Aproximadamente 1 de cada 12 hombres tiene alguna forma de daltonismo
   rojo-verde — la paleta ya está elegida para ser distinguible en esos
   casos.
3. **Todo elemento interactivo mide al menos 44×44px** (`MIN_TOUCH_TARGET_PX`
   en `Accessibility.ts`). En dev, usa `warnIfBelowMinTouchTarget()` al
   construir botones/UI custom que no pasen por `UIKit.Button` (que ya
   cumple esto por defecto).
4. **Texto legible**: tamaño de fuente mínimo 16px para texto informativo,
   y no dependas solo del color para distinguir estados en texto (agrega
   ícono o texto adicional, ej. "✅ Correcto" no solo un check verde).

## Checklist

- [ ] ¿Todo evento con sonido tiene también señal visual?
- [ ] ¿Los colores de estado usan `A11Y_PALETTE` en vez de rojo/verde puro?
- [ ] ¿Los botones personalizados (no `UIKit.Button`) miden ≥44×44px?
- [ ] ¿El texto informativo es ≥16px y no depende solo del color?
