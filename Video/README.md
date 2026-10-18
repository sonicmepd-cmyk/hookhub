# HookHub — Anuncio promocional

Video promocional de 50 s (1920×1080, 30 fps, MP4 H.264) producido con [Remotion](https://www.remotion.dev). Todo el audio —música, efectos y voz en off— se genera con scripts deterministas incluidos en este repositorio.

## Escenas

| # | Tiempo | Contenido |
|---|---|---|
| 1 | 0–6 s | Hook: el creador frente a la hoja en blanco |
| 2 | 6–13 s | Estrategia: guiones y estructura narrativa |
| 3 | 13–20 s | Marca HookHub (logo + tagline) |
| 4 | 20–34 s | Capacidades (6 micro-beats: analítica, IA, guiones, estrategia, integraciones, estudio) |
| 5 | 34–42 s | Visión: la herramienta como centro del flujo |
| 6 | 42–50 s | Cierre de marca — «En desarrollo» |

## Requisitos

- Node.js 20+ (probado con 22.14) y npm 10+
- Internet solo para: instalar dependencias y regenerar la voz en off (edge-tts). El render y la música son 100 % locales.

## Instalación

```powershell
cd Video
npm install
```

Si `npm install` falla con errores de `esbuild` (EFTYPE u otros), limpia e reintenta:

```powershell
Remove-Item -Recurse -Force node_modules
npm cache clean --force
npm install
```

## Generar los audios

Los archivos de `public/audio/` vienen incluidos; solo hay que regenerarlos si cambias la música, los SFX o el guion de la voz.

```powershell
npm run audio   # música + 13 SFX sintetizados -> public/audio/music.wav, public/audio/sfx/
npm run vo      # voz en off (edge-tts, es-MX-DaliaNeural) -> public/audio/vo/*.mp3 + normalización a WAV 48 kHz
```

- `npm run vo` requiere conexión a internet (usa el servicio de edge-tts) y el paquete global `edge-tts` (`pip install edge-tts` o `npm i -g edge-tts-cli`).
- La voz se genera en MP3 con edge-tts y se normaliza a WAV mono 48 kHz con ffmpeg (`loudnorm`) para el mix final.

## Vista previa

```powershell
npm run studio
```

Abre el Remotion Studio en el navegador para editar en vivo la composición `Promo`.

## Render final

```powershell
# si ya existe un video.mp4, bórralo antes (en Windows un render encima puede fallar con EPERM)
Remove-Item out\video.mp4 -Force -ErrorAction SilentlyContinue
npm run render
```

Salida: `out/video.mp4` (H.264 + AAC, CRF 17). Un render completo tarda ~10–15 minutos en un portátil medio.

Para reconstruir todo desde cero:

```powershell
npm run build    # audio + vo + render
```

## Estructura

```
Video/
├── public/
│   ├── audio/          # music.wav, sfx/, vo/ (wav normalizado + mp3 original de edge-tts)
│   └── fonts/          # Space Grotesk y DM Sans (OFL), auto-alojadas
├── scripts/
│   ├── make-audio.mjs  # sintetiza música (BPM 90) y SFX
│   ├── make-vo.mjs     # genera y normaliza la voz en off
│   └── analyze-audio.mjs  # verifica picos, RMS y silencios del mix
├── src/
│   ├── Root.tsx        # composición Promo (1500 frames @ 30 fps)
│   ├── Promo.tsx       # ensambla escenas + Grade + pistas de audio
│   ├── theme.ts        # paleta, tipografías, easings, springs
│   ├── audio/          # timeline (tiempos por frames) y Tracks (ducking)
│   ├── scenes/         # Scene1–Scene6 + beats de la escena 4
│   └── components/     # capas (malla, grano, viñeta), tipografía, logo, UI conceptual
└── out/                # video.mp4 y frames de verificación
```

## Verificación de audio

```powershell
node scripts/analyze-audio.mjs
```

Comprueba duración, picos (dBFS), RMS, silencios inesperados y la presencia de voz en cada franja del guion. Limitación: no sustituye escuchar el resultado; es una verificación automática de niveles y continuidad.

## Notas de producción

- Las interfaces mostradas son **conceptos visuales en desarrollo**, no capturas de producto terminado.
- El logo es una reconstrucción a partir de `Web/public/favicon.svg`; no es el logotipo oficial definitivo.
- Música y SFX se sintetizan por script (sin licencias de terceros). BPM 90, key relativa menor.
- La voz usa edge-tts (`es-MX-DaliaNeural`); se necesita internet solo al regenerarla.
- Paleta y tipografía alineadas con la web: `#2563EB` / `#0B1F44` / `#DBEAFE` / `#FFFFFF` / `#F3F6FB`, Space Grotesk + DM Sans.
