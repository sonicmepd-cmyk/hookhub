import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/** Entrada premium: fade + rise + scale (2–3 propiedades). */
export const Entrance: React.FC<{
  delay?: number;
  children: React.ReactNode;
  y?: number;
  scaleFrom?: number;
}> = ({ delay = 0, children, y = 36, scaleFrom = 0.96 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px) scale(${interpolate(
          p,
          [0, 1],
          [scaleFrom, 1]
        )})`,
      }}
    >
      {children}
    </div>
  );
};

/** Salida — más rápida que la entrada (~10 frames vs ~20). */
export const useExit = (durationInFrames: number, lead = 12) => {
  const frame = useCurrentFrame();
  const start = durationInFrames - lead;
  const o = interpolate(frame, [start, durationInFrames - 2], [1, 0], {
    easing: theme.ease.in,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [start, durationInFrames - 2], [0, -28], {
    easing: theme.ease.in,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: o, transform: `translateY(${y}px)` };
};

/** Micro-movimiento idle: respiración para elementos >2s en pantalla. */
export const breathe = (frame: number, amp = 0.014, period = 24) =>
  1 + Math.sin(frame / period) * amp;
export const floatY = (frame: number, amp = 3, period = 32) =>
  Math.sin(frame / period) * amp;

/**
 * Tarjeta conceptual de UI — panel translúcido premium.
 * No es una captura real: es una interfaz conceptual en desarrollo.
 */
export const GlassPanel: React.FC<{
  children: React.ReactNode;
  width?: number;
  height?: number;
  padding?: number;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ children, width, height, padding = 28, radius = 20, style }) => (
  <div
    style={{
      width,
      height,
      padding,
      borderRadius: radius,
      background: `linear-gradient(160deg, ${theme.colors.white}10, ${theme.colors.white}05)`,
      border: `1px solid ${theme.colors.white}1A`,
      boxShadow: `0 24px 60px -18px rgba(0,0,0,0.5), inset 0 1px 0 ${theme.colors.white}14`,
      backdropFilter: "blur(8px)",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Píldora de badge superior (p.ej. "Concepto"). */
export const Badge: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => (
  <Entrance delay={delay} y={10} scaleFrom={0.9}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 999,
        background: `${theme.colors.primary}1F`,
        border: `1px solid ${theme.colors.primary}44`,
        color: theme.colors.light,
        fontFamily: theme.fonts.body,
        fontSize: 17,
        fontWeight: 500,
        letterSpacing: "0.04em",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: theme.colors.primary,
        }}
      />
      {text}
    </div>
  </Entrance>
);
