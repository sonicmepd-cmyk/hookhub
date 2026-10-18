import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grain, Vignette } from "../components/Layers";
import { WordReveal } from "../components/Type";
import { Entrance } from "../components/Ui";

/**
 * Escena 1 — La idea (0–6 s / 180 frames)
 * Señal luminosa central → líneas geométricas se organizan → titular.
 */
export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Núcleo: aparece con un pop y respira
  const coreIn = spring({ frame, fps, config: theme.spring.bouncy });
  const coreScale = interpolate(coreIn, [0, 1], [0.2, 1]);
  const pulse = 1 + Math.sin(frame / 14) * 0.06;
  const coreGlow = interpolate(frame, [0, 20, 180], [0, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Onda expansiva continua desde el núcleo
  const ringProgress = (frame % 56) / 56;
  const ring2Progress = ((frame + 28) % 56) / 56;

  // 6 rayos/líneas geométricas que se dibujan con stagger
  const rays = 6;

  // Título entra tras la señal (frame 48)
  const titleDelay = 48;

  return (
    <AbsoluteFill>
      <BgMesh />
      {/* Núcleo + geometría */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            width: 900,
            height: 900,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Ondas expansivas */}
          {[ringProgress, ring2Progress].map((r, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 120 + r * 620,
                height: 120 + r * 620,
                borderRadius: "50%",
                border: `1.5px solid ${theme.colors.primary}`,
                opacity: (1 - r) * 0.32 * coreGlow,
                transform: `translate(${i === 0 ? 0 : 14}px, ${i === 0 ? 0 : -10}px)`,
              }}
            />
          ))}
          {/* Rayos geométricos */}
          {Array.from({ length: rays }).map((_, i) => {
            const p = spring({
              frame: frame - 8 - i * 4,
              fps,
              config: theme.spring.smooth,
            });
            const angle = (360 / rays) * i + 18;
            const len = 180 + (i % 3) * 70;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 2,
                  height: len * p,
                  background: `linear-gradient(${theme.colors.primary}, transparent)`,
                  opacity: 0.55 * p,
                  transformOrigin: "50% 0%",
                  transform: `rotate(${angle}deg) translateY(70px)`,
                }}
              />
            );
          })}
          {/* Núcleo luminoso */}
          <div
            style={{
              position: "absolute",
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: theme.colors.white,
              boxShadow: `0 0 ${40 * coreGlow}px ${theme.colors.primary}, 0 0 ${
                110 * coreGlow
              }px ${theme.colors.glow}`,
              transform: `scale(${coreScale * pulse})`,
              opacity: coreIn,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* Titular */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 210,
        }}
      >
        <Entrance delay={titleDelay} y={30}>
          <WordReveal
            text="Crear contenido es solo el comienzo."
            delay={titleDelay}
            per={4}
            size={64}
            weight={500}
            highlight={["comienzo."]}
          />
        </Entrance>
      </AbsoluteFill>

      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
