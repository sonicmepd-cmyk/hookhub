import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grain, Vignette } from "../components/Layers";
import { LogoLockup } from "../components/Logo";
import { Entrance } from "../components/Ui";

/**
 * Escena 6 — Cierre de marca (42–50 s / 240 frames)
 * Azul profundo. Logo, tagline y "En desarrollo". Resolución limpia.
 */
export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Halo suave que respira detrás del logo
  const halo = spring({ frame: frame - 4, fps, config: theme.spring.smooth });
  const breathe = 1 + Math.sin(frame / 30) * 0.03;

  // Fade final limpio (últimos 30 frames → negro)
  const fadeOut = interpolate(frame, [206, 238], [1, 0], {
    easing: theme.ease.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <BgMesh />
      {/* Halo */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 1000,
            height: 1000,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.colors.primary}22, transparent 62%)`,
            transform: `scale(${interpolate(halo, [0, 1], [0.5, 1]) * breathe})`,
            opacity: 0.9,
          }}
        />
      </AbsoluteFill>

      {/* Lockup */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", gap: 0 }}
      >
        <LogoLockup markSize={116} wordSize={104} delay={10} />
      </AbsoluteFill>

      {/* Tagline + estado */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 200,
          gap: 34,
        }}
      >
        <Entrance delay={56} y={22}>
          <div
            style={{
              fontFamily: theme.fonts.display,
              fontSize: 46,
              fontWeight: 500,
              color: theme.colors.textOnDark,
              letterSpacing: "-0.02em",
            }}
          >
            Todo empieza con una idea.
          </div>
        </Entrance>
        <Entrance delay={78} y={14}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 22px",
              borderRadius: 999,
              background: `${theme.colors.white}0A`,
              border: `1px solid ${theme.colors.white}22`,
              fontFamily: theme.fonts.body,
              fontSize: 21,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: theme.colors.textDim,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: theme.colors.primary,
              }}
            />
            En desarrollo
          </div>
        </Entrance>
      </AbsoluteFill>

      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
