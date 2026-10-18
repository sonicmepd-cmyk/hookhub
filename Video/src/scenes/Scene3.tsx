import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grain, Vignette } from "../components/Layers";
import { LogoLockup } from "../components/Logo";
import { Entrance } from "../components/Ui";
import { Eyebrow } from "../components/Type";

/**
 * Escena 3 — Presentación de HookHub (13–20 s / 210 frames)
 * El momento de marca: impacto controlado, iluminación sutil, pausa para respirar.
 */
export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flash de revelado (2 frames tras el golpe) — sutil, no estroboscópico
  const flash = interpolate(frame, [0, 4, 22], [0, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Halo detrás del logo, crece y se asienta
  const halo = spring({ frame: frame - 6, fps, config: theme.spring.smooth });
  const haloScale = interpolate(halo, [0, 1], [0.4, 1]);
  const haloOpacity = interpolate(frame, [0, 30, 180], [0, 0.8, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Destello diagonal que barre el logo (una vez, frames 40–70)
  const sweep = interpolate(frame, [40, 70], [-40, 140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.inOut,
  });
  const sweepActive = frame >= 40 && frame <= 72;

  // Rayos de luz radiales discretos tras el logo
  const rays = 14;

  // Micro dolly-in del conjunto (la cámara se acerca un pelín)
  const dolly = interpolate(frame, [0, 210], [0.97, 1.03], {
    easing: theme.ease.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Conoce HookHub." aparece tras el logo
  const tagDelay = 58;

  return (
    <AbsoluteFill>
      <BgMesh />
      {/* Halo de luz */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 1100,
            height: 1100,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.colors.primary}30, transparent 60%)`,
            transform: `scale(${haloScale})`,
            opacity: haloOpacity,
          }}
        />
        {/* Rayos radiales */}
        {Array.from({ length: rays }).map((_, i) => {
          const p = spring({ frame: frame - 8 - i * 1.5, fps, config: theme.spring.smooth });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 1.5,
                height: 520 * p,
                background: `linear-gradient(${theme.colors.light}00, ${theme.colors.light}2A, ${theme.colors.light}00)`,
                transformOrigin: "50% 50%",
                transform: `rotate(${(360 / rays) * i}deg) translateY(120px)`,
                opacity: 0.6 * p,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* Lockup central */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", zIndex: 4 }}
      >
        <div
          style={{
            position: "relative",
            transform: `scale(${dolly})`,
            overflow: "hidden",
            padding: "30px 50px",
            borderRadius: 30,
          }}
        >
          <LogoLockup markSize={132} wordSize={118} delay={4} />
          {/* Barrido de luz sobre el lockup */}
          {sweepActive && (
            <div
              style={{
                position: "absolute",
                top: -20,
                bottom: -20,
                left: `${sweep}%`,
                width: 140,
                background: `linear-gradient(100deg, transparent, ${theme.colors.white}22, transparent)`,
                transform: "skewX(-18deg)",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </AbsoluteFill>

      {/* Eyebrow + tagline */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 190,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <Eyebrow text="Conoce" delay={tagDelay} color={theme.colors.light} />
          <Entrance delay={tagDelay + 6} y={24}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 44,
                fontWeight: 500,
                color: theme.colors.textOnDark,
                letterSpacing: "-0.02em",
              }}
            >
              Un espacio para tu estrategia.
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>

      {/* Flash */}
      <AbsoluteFill
        style={{
          background: theme.colors.light,
          opacity: flash,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
