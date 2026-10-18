import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * Fondo con malla de luz (nunca un plano sólido).
 * Dos halos radiales que respiran + rejilla sutil de profundidad.
 */
export const BgMesh: React.FC<{ hue?: "deep" | "deepAlt" }> = ({ hue = "deep" }) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 65) * 60;
  const d2 = Math.cos(frame / 80) * 45;
  const base = hue === "deep" ? theme.colors.deep : theme.colors.deepAlt;
  return (
    <AbsoluteFill style={{ background: base }}>
      {/* Halo héroe (azul) */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          top: -500,
          left: 260 + d1,
          filter: "blur(60px)",
          background: `radial-gradient(circle, ${theme.colors.primary}2E, transparent 62%)`,
        }}
      />
      {/* Halo secundario (frío) */}
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          bottom: -480,
          right: -180 - d2,
          filter: "blur(80px)",
          background: `radial-gradient(circle, ${theme.colors.light}14, transparent 66%)`,
        }}
      />
      {/* Rejilla de profundidad */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.colors.white}06 1px, transparent 1px),
                            linear-gradient(90deg, ${theme.colors.white}06 1px, transparent 1px)`,
          backgroundSize: "120px 120px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.5), transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.5), transparent 72%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Grade cinematográfico — unifica toda la pieza. */
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.primary,
        mixBlendMode: "soft-light",
        opacity: 0.14,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(4,10,26,0.22), transparent 26%, transparent 74%, rgba(4,10,26,0.30))",
      }}
    />
  </AbsoluteFill>
);

/** Grano procedural — textura de película, cero assets. */
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: noise,
        backgroundSize: "220px",
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
        opacity: 0.05,
        mixBlendMode: "overlay",
      }}
    />
  );
};

/** Viñeta — el sello cinematográfico. */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, transparent 54%, rgba(2,8,22,0.30) 100%)",
    }}
  />
);

/**
 * Ken Burns envolvente para la escena completa: zoom virtual lento.
 * Da sensación de cámara sin assets de vídeo.
 */
export const KenBurnsVirtual: React.FC<{
  from?: number;
  to?: number;
  children: React.ReactNode;
}> = ({ from = 1, to = 1.05, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [from, to], {
    easing: theme.ease.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>{children}</AbsoluteFill>
  );
};
