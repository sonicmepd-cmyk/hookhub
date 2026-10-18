import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grain, Vignette } from "../components/Layers";
import { HookMark } from "../components/Logo";

/**
 * Escena 5 — La visión (34–42 s / 240 frames)
 * Convergencia + dolly-in suave. Clímax musical.
 * "Tu contenido. Tu estrategia. Tu crecimiento."
 */
export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dolly-in: la cámara se acerca mientras todo se ordena
  const dolly = interpolate(frame, [0, 240], [0.94, 1.06], {
    easing: theme.ease.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Anillos que convergen hacia el centro
  const converge = spring({ frame, fps, config: theme.spring.smooth });

  // Tres frases del titular, stagger
  const lines = ["Tu contenido.", "Tu estrategia.", "Tu crecimiento."];

  // Halo que crece con la intensidad
  const glow = interpolate(frame, [0, 90, 200], [0.3, 0.9, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BgMesh />
      {/* Anillos convergentes */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ transform: `scale(${dolly})`, position: "relative", width: 900, height: 900 }}>
          {[1, 0.72, 0.46].map((s, i) => {
            const p = spring({
              frame: frame - i * 8,
              fps,
              config: theme.spring.smooth,
            });
            const size = 900 * s * interpolate(p, [0, 1], [1.5, 1]);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (900 - size) / 2,
                  top: (900 - size) / 2,
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  border: `1.5px solid ${i === 2 ? theme.colors.primary : `${theme.colors.light}22`}`,
                  opacity: (0.4 + i * 0.15) * converge,
                }}
              />
            );
          })}
          {/* Marca central */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              filter: `drop-shadow(0 0 ${70 * glow}px ${theme.colors.glow})`,
            }}
          >
            <HookMark size={160} delay={20} />
          </div>
        </div>
      </AbsoluteFill>

      {/* Titular en tres tiempos */}
      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 170 }}
      >
        <div
          style={{
            display: "flex",
            gap: 56,
            fontFamily: theme.fonts.display,
            fontSize: 58,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: theme.colors.white,
          }}
        >
          {lines.map((l, i) => {
            const p = spring({
              frame: frame - 70 - i * 14,
              fps,
              config: theme.spring.smooth,
            });
            return (
              <span
                key={i}
                style={{
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [36, 0])}px)`,
                  color: i === 2 ? theme.colors.primary : theme.colors.white,
                  textShadow:
                    i === 2 ? `0 0 40px ${theme.colors.glow}` : "none",
                }}
              >
                {l}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
