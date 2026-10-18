// timeline.ts â€” Ãºnica fuente de verdad de tiempos (frames @30fps).
// 1500 frames = 50 s.

export const FPS = 30;
export const DURATION = 1500;

// Escenas
export const S1 = { from: 0, dur: 180 }; // 0â€“6s    La idea
export const S2 = { from: 180, dur: 210 }; // 6â€“13s   El desafÃ­o
export const S3 = { from: 390, dur: 210 }; // 13â€“20s  HookHub
export const S4 = { from: 600, dur: 420 }; // 20â€“34s  Capacidades (6Ã—70)
export const S5 = { from: 1020, dur: 240 }; // 34â€“42s  La visiÃ³n
export const S6 = { from: 1260, dur: 240 }; // 42â€“50s  Cierre

// Beats dentro de la Escena 4 (6 Ã— 70 frames)
export const BEAT_DUR = 70;
export const beats = [0, 70, 140, 210, 280, 350].map((o) => ({
  from: S4.from + o,
  dur: BEAT_DUR,
}));

// â”€â”€ NarraciÃ³n (duraciones medidas de los WAV) â”€â”€
// dur en frames = segundos * 30
export const VO = [
  { id: "01-idea", from: 30, dur: 94 }, // "Crear contenido es solo el comienzo."
  { id: "02-strategy", from: 200, dur: 120 }, // "DetrÃ¡s de cada gran idea, hay una estrategia."
  { id: "03-hookhub", from: 398, dur: 240 }, // "Por eso nace HookHub: â€¦"
  { id: "04-journey", from: 655, dur: 137 }, // "Desde tus primeros conceptosâ€¦"
  { id: "04-step", from: 800, dur: 68 }, // "cada paso importa."
  { id: "04-tools", from: 880, dur: 159 }, // "Estrategia, integracionesâ€¦"
  { id: "05-vision", from: 1060, dur: 174 }, // "Tu contenido. Tu estrategiaâ€¦"
  { id: "06-brand", from: 1300, dur: 56 }, // "HookHub."
  { id: "07-tagline", from: 1380, dur: 78 }, // "Todo empieza con una idea."
];

// â”€â”€ SFX (frames) â”€â”€
export const SFX = [
  { id: "shimmer", from: 10, vol: 0.4 }, // seÃ±al luminosa aparece
  { id: "tick", from: 28, vol: 0.4 }, // primer texto
  { id: "blip", from: 96, vol: 0.34 }, // formas geomÃ©tricas
  { id: "whoosh-soft", from: 172, vol: 0.6 }, // transiciÃ³n escena 2
  { id: "tick-low", from: 210, vol: 0.4 }, // texto desafÃ­o
  { id: "riser", from: 330, vol: 0.34 }, // anticipaciÃ³n â†’ reveal
  { id: "impact", from: 388, vol: 0.55 }, // golpe del reveal
  { id: "subdrop", from: 388, vol: 0.34 }, // sub del reveal
  { id: "tick", from: 470, vol: 0.4 }, // "Conoce HookHub"
  // Escena 4 â€” cada capacidad tiene su golpe
  { id: "whoosh-down", from: 596, vol: 0.42 },
  { id: "blip-high", from: 602, vol: 0.4 },
  { id: "whoosh-down", from: 666, vol: 0.4 },
  { id: "blip", from: 672, vol: 0.34 },
  { id: "whoosh-down", from: 736, vol: 0.4 },
  { id: "blip-high", from: 742, vol: 0.34 },
  { id: "whoosh-down", from: 806, vol: 0.4 },
  { id: "blip", from: 812, vol: 0.34 },
  { id: "whoosh-down", from: 876, vol: 0.4 },
  { id: "blip-high", from: 882, vol: 0.34 },
  { id: "whoosh-down", from: 946, vol: 0.4 },
  { id: "blip", from: 952, vol: 0.34 },
  // Hacia la visiÃ³n
  { id: "riser-short", from: 970, vol: 0.4 },
  { id: "whoosh-strong", from: 1014, vol: 0.7 },
  { id: "shimmer", from: 1060, vol: 0.4 },
  // Cierre
  { id: "whoosh-soft", from: 1252, vol: 0.42 },
  { id: "shimmer", from: 1268, vol: 0.34 },
  { id: "tick", from: 1302, vol: 0.34 },
  { id: "blip", from: 1384, vol: 0.4 },
];

// â”€â”€ Ducking de mÃºsica bajo la voz â”€â”€
export const DUCK_LEVEL = 0.42;
export const DUCK_RAMP = 9; // frames de rampa
