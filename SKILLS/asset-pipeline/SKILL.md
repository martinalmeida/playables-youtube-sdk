# Skill: asset-pipeline

## Cuándo usar esta skill

Al agregar, optimizar u organizar imágenes, audio, spritesheets, o el material
de publicación (miniatura y video de preview) de un juego.

## Audio: SfxSynth (procedural) vs assets reales

**Regla por defecto: usa `core/SfxSynth.ts` para SFX de UI y feedback
inmediato** (tap, coin, hit, click, powerup, error, win, lose). Es
procedural (Web Audio API, sin archivos), así que no depende de ningún
asset externo ni de licencias — funciona apenas se genera el juego, sin
intervención humana.

Usa assets de audio reales (archivos) solo cuando:
- Se necesita **música** (SfxSynth no está pensado para eso).
- Se necesita un sonido con carácter orgánico específico (voces, instrumentos
  reales, ambientes) que la síntesis no puede replicar bien.

En esos casos, el agente **no puede generar ni descargar el archivo por su
cuenta** — debe pedir al usuario humano que aporte el asset, o señalar
fuentes de audio con licencia libre para que el usuario elija y lo
suministre (nunca asumir que un archivo encontrado en la red es de uso
libre sin que el usuario lo confirme):
- Kenney.nl (CC0, muchos packs de SFX 8-bit/arcade)
- OpenGameArt.org (licencias variadas, verificar cada asset)
- freesound.org (licencias variadas, verificar cada asset)

Nunca incluyas un archivo de audio de una fuente no verificada directamente
en el repo del juego sin que el usuario confirme la licencia.

## Organización de archivos

- Assets que se importan como módulo JS (empaquetados por Vite) van en
  `src/assets/` e importan con `import img from './assets/x.png'`.
- Assets estáticos que se cargan en runtime (audio, video, spritesheets
  grandes) van en `public/assets/` y se referencian por ruta string en los
  `preload()` de Phaser: `this.load.image('bg', 'assets/bg.png')`.
- Nunca mezclar ambos criterios para el mismo tipo de asset dentro de un
  mismo juego — elegir uno por categoría y ser consistente.

## Presupuesto de carga

Playables prioriza tiempo de carga bajo. Antes de dar un juego por terminado:

- Comprimir imágenes (WebP cuando sea posible, PNG optimizado si se necesita
  transparencia sin pérdida).
- Usar atlas/spritesheets en vez de decenas de archivos sueltos para
  animaciones.
- Auditar el tamaño del bundle final (`npm run build` + revisar `dist/`) con
  la pestaña Network de Chrome DevTools en modo emulación móvil con
  throttling.

## Material de publicación (requerido para certificación)

| Asset | Requisito |
|---|---|
| Miniatura | Cuadrada (1:1), mínimo 512×512 px, debe incluir el título del juego, sin marca/logo de terceros |
| Zona segura de miniatura | No poner texto ni elementos críticos en el 12% superior ni inferior de la imagen (la UI de YouTube puede taparlos) |
| Video de preview | 16:9, mínimo 1280×720 px, formato compatible con YouTube |
| Descripción del juego | Máximo 150 caracteres, sin branding/logos |
| Título del juego | Máximo 50 caracteres (algunas superficies limitan a 20, usar el más corto como referencia segura) |

Estos assets no viven en `src/` ni `public/` del juego — van en una carpeta
`store-assets/` en la raíz del juego, separada del código, para que quien
suba al Developer Portal los encuentre sin tener que buscar en el bundle.

## Checklist

- [ ] ¿Cada asset está en la carpeta correcta según si se importa o se carga
      en runtime?
- [ ] ¿Se auditó el tamaño total del build?
- [ ] ¿Existen los 4 assets de publicación (miniatura, video, descripción,
      título) en `store-assets/` y cumplen las medidas/límites de caracteres?
- [ ] ¿La miniatura respeta la zona segura del 12% superior/inferior?
