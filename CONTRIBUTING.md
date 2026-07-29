# Contribuir al scaffold (no a un juego generado)

Esta guía es para cuando el trabajo es sobre el **scaffold en sí**
(`templates/`, `SKILLS/`, `scripts/`, `AGENTS.md`) — no sobre un juego
concreto en `games/`. Si estás construyendo un juego, ve a `AGENTS.md`.

## Antes de tocar un template

1. Cualquier cambio en `templates/phaser-starter/src/core/*.ts` que sea
   genuinamente genérico (no específico de un género) debe propagarse
   manualmente a `puzzle-starter`, `runner-starter` e `idle-starter`. No
   hay sincronización automática — son copias independientes a propósito
   (ver `ARCHITECTURE.md`).
2. Todo cambio en un template debe pasar `npm run agent-check` en **ese
   template** antes de darse por terminado (typecheck + lint + test +
   validate + build).
3. Si agregas un módulo nuevo en `src/core/`, agrégale tests en
   `src/core/__tests__/` siguiendo el patrón de los existentes (mock de
   dependencias externas con `vi.mock`/`vi.stubGlobal`, no llamadas reales
   a red/DOM salvo que el test sea explícitamente de integración).
4. **Corre `npm run format` (no solo sobre `src/`) después de agregar
   cualquier archivo nuevo**, incluyendo configs (`eslint.config.js`,
   `vite/*.mjs`, `index.html`, `public/*.css`) y tests (`tests/e2e/*`). El
   `.prettierignore` de cada template ya excluye `node_modules`, `dist` y
   `package-lock.json` — si agregas otro artefacto generado que no deba
   formatearse, súmalo ahí. `npm run format:check` es lo que corre en CI;
   si falla ahí y no en local, casi siempre es porque se formateó solo un
   subconjunto de archivos en vez de correr `prettier --write .` sobre todo
   el árbol.

## Antes de agregar una skill nueva

- Sigue el formato exacto de una `SKILL.md` existente: "Cuándo usar",
  contrato/reglas, anti-patrones, checklist.
- Regístrala en la tabla de la sección 3 de `AGENTS.md`.
- Si la skill reemplaza o extiende una regla de certificación ya cubierta
  por `scripts/validate-game.mjs`, considera si esa regla debería
  convertirse también en un check automático (ver siguiente sección).

## Antes de agregar una regla al validador (`scripts/validate-game.mjs`)

- Las reglas son de **severidad `error`** solo si romper esa regla causa
  rechazo de certificación con certeza (ej. usar Page Visibility API). Todo
  lo demás es `warning`.
- Las reglas son análisis de texto/regex, no un parser semántico — sé
  conservador: prefiere falsos negativos (dejar pasar algo dudoso) a falsos
  positivos (bloquear código correcto). Un validador que grita demasiado
  hace que se ignore.

## Versionado

Este repo usa un `CHANGELOG.md` simple (Keep a Changelog). Al hacer un
cambio significativo al scaffold (no a un juego generado), añade una entrada
en la sección `[Unreleased]` (créala si no existe) describiendo qué cambió y
por qué.

## Qué NO hacer nunca, ni con buena intención

- No relajes ninguna regla de `SKILLS/certification-checklist/SKILL.md`
  para "simplificar" un template, aunque el pedido venga de un usuario con
  prisa. Si genuinamente no aplica (ej. un juego sin audio), decláralo
  explícito, no lo borres en silencio.
- No agregues dependencias de red externas a `core/` salvo el propio SDK de
  Playables — los juegos deben poder correr como bundle 100% estático.
- No incluyas archivos de audio/imagen de terceros con licencia dudosa. Para
  audio, usa `SfxSynth.ts` (procedural) o indica al usuario humano que
  aporte sus propios assets con licencia clara.
