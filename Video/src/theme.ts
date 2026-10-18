// theme.ts — única fuente de verdad: colores, easings, springs, tipografías.
import { Easing } from "remotion";

export const theme = {
  colors: {
    // Paleta HookHub
    deep: "#0B1F44", // azul profundo (base oscura)
    deepAlt: "#081633", // variante más oscura para el mesh
    primary: "#2563EB", // azul héroe
    primaryDim: "#1D4ED8",
    light: "#DBEAFE", // azul claro
    white: "#FFFFFF",
    cool: "#F3F6FB", // gris frío
    ink: "#0A1730", // texto sobre claro
    textOnDark: "#EAF2FF",
    textDim: "#8FA6C9",
    glow: "rgba(37, 99, 235, 0.45)",
    glowSoft: "rgba(219, 234, 254, 0.25)",
  },
  fonts: {
    display: "'Space Grotesk'", // títulos — coherente con la web HookHub
    body: "'DM Sans'", // cuerpo — coherente con la web HookHub
  },
  // Easings. Lineal prohibido.
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo — entradas
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // easeInOutQuint — movimientos
    in: Easing.bezier(0.7, 0, 0.84, 0), // solo salidas
    soft: Easing.bezier(0.33, 1, 0.68, 1), // easeOutCubic — suave
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 }, // pops de UI, palabras
    smooth: { damping: 20, stiffness: 90, mass: 1 }, // elementos grandes
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 }, // logos, acentos
  },
} as const;

// BPM 90 → 20 frames/beat a 30 fps. Cortes sobre el beat.
export const BPM = 90;
export const FPS = 30;
export const BEAT = (FPS * 60) / BPM; // 20 frames
