import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { BgMesh, Grain, Vignette } from "../components/Layers";
import { WordReveal } from "../components/Type";
import { GlassPanel } from "../components/Ui";

// Bloques de "contenido disperso" — cada uno con su propio lenguaje visual.
type BlockKind = "note" | "chart" | "idea" | "metric" | "tag" | "clip";

const BLOCKS: {
  kind: BlockKind;
  x: number;
  y: number;
  w: number;
  h: number;
  delay: number;
  label?: string;
  value?: string;
}[] = [
  { kind: "note", x: 320, y: 250, w: 210, h: 140, delay: 8, label: "Idea suelta" },
  { kind: "chart", x: 1380, y: 210, w: 240, h: 170, delay: 14 },
  { kind: "idea", x: 250, y: 620, w: 190, h: 120, delay: 20, label: "¿Título?" },
  { kind: "metric", x: 1420, y: 600, w: 200, h: 130, delay: 26, value: "12%" },
  { kind: "tag", x: 640, y: 180, w: 150, h: 60, delay: 32, label: "#growth" },
  { kind: "clip", x: 1180, y: 760, w: 230, h: 110, delay: 38 },
  { kind: "note", x: 700, y: 810, w: 200, h: 130, delay: 44, label: "Borrador" },
  { kind: "tag", x: 1560, y: 380, w: 140, h: 56, delay: 50, label: "shorts" },
];

const MiniChart: React.FC<{ seed: number }> = ({ seed }) => {
  const bars = [0.5, 0.8, 0.35, 0.9, 0.6];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 80, marginTop: 8 }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            width: 18,
            height: b * 80 * (0.7 + ((seed + i) % 5) * 0.06),
            borderRadius: 4,
            background:
              i === 3 ? theme.colors.primary : `${theme.colors.light}44`,
          }}
        />
      ))}
    </div>
  );
};

const Block: React.FC<(typeof BLOCKS)[number]> = ({
  kind,
  x,
  y,
  w,
  h,
  delay,
  label,
  value,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  // Deriva lenta y controlada (no caos)
  const drift = interpolate(frame, [0, 210], [0, -18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.inOut,
  });
  const bob = Math.sin((frame + delay * 3) / 30) * 4;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: p * 0.92,
        transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(
          p,
          [0, 1],
          [0.9, 1]
        )}) translateY(${drift + bob}px)`,
      }}
    >
      <GlassPanel width={w} height={h} padding={18} radius={16}>
        {kind === "note" && (
          <>
            <div
              style={{
                width: "60%",
                height: 10,
                borderRadius: 4,
                background: `${theme.colors.light}55`,
                marginBottom: 12,
              }}
            />
            <div
              style={{
                width: "90%",
                height: 8,
                borderRadius: 4,
                background: `${theme.colors.white}22`,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                width: "70%",
                height: 8,
                borderRadius: 4,
                background: `${theme.colors.white}18`,
              }}
            />
            {label && (
              <div
                style={{
                  marginTop: "auto",
                  fontFamily: theme.fonts.body,
                  fontSize: 17,
                  color: theme.colors.textDim,
                }}
              >
                {label}
              </div>
            )}
          </>
        )}
        {kind === "chart" && <MiniChart seed={delay} />}
        {kind === "idea" && (
          <div
            style={{
              margin: "auto",
              fontFamily: theme.fonts.display,
              fontSize: 30,
              fontWeight: 500,
              color: theme.colors.light,
              opacity: 0.85,
            }}
          >
            {label}
          </div>
        )}
        {kind === "metric" && (
          <div style={{ margin: "auto", textAlign: "center" }}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 46,
                fontWeight: 600,
                color: theme.colors.white,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 15,
                color: theme.colors.textDim,
                marginTop: 4,
              }}
            >
              retención
            </div>
          </div>
        )}
        {kind === "tag" && (
          <div
            style={{
              margin: "auto",
              fontFamily: theme.fonts.body,
              fontSize: 20,
              fontWeight: 500,
              color: theme.colors.light,
              padding: "6px 14px",
              borderRadius: 999,
              background: `${theme.colors.primary}22`,
              border: `1px solid ${theme.colors.primary}44`,
            }}
          >
            {label}
          </div>
        )}
        {kind === "clip" && (
          <div style={{ margin: "auto", width: "100%" }}>
            <div
              style={{
                height: 36,
                borderRadius: 6,
                background: `linear-gradient(90deg, ${theme.colors.primary}44, ${theme.colors.light}22)`,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 14,
                borderRadius: 4,
                background: `${theme.colors.white}18`,
              }}
            />
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

/**
 * Escena 2 — El desafío (6–13 s / 210 frames)
 * Contenido disperso en movimiento controlado + titular.
 */
export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleDelay = 108;
  return (
    <AbsoluteFill>
      <BgMesh hue="deepAlt" />
      {BLOCKS.map((b, i) => (
        <Block key={i} {...b} />
      ))}
      {/* Titular */}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", zIndex: 5 }}
      >
        <div
          style={{
            padding: "48px 90px",
            borderRadius: 28,
            background: "radial-gradient(ellipse at center, rgba(8,22,51,0.92), rgba(8,22,51,0.55))",
            border: `1px solid ${theme.colors.white}10`,
            opacity: interpolate(frame, [titleDelay - 8, titleDelay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `scale(${interpolate(
              spring({ frame: frame - titleDelay, fps, config: theme.spring.smooth }),
              [0, 1],
              [0.96, 1]
            )})`,
          }}
        >
          <WordReveal
            text="La estrategia cambia todo."
            delay={titleDelay}
            per={4}
            size={78}
            weight={600}
            highlight={["estrategia"]}
          />
        </div>
      </AbsoluteFill>
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
