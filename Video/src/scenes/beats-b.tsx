import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { Entrance, GlassPanel, Badge } from "../components/Ui";

/**
 * Beat D — Estrategia (210–280)
 * Elementos dispersos que se ordenan en una ruta visual coherente.
 */
export const BeatStrategy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { t: "Analiza", x: 90, y: 300 },
    { t: "Planifica", x: 260, y: 190 },
    { t: "Crea", x: 430, y: 260 },
    { t: "Mide", x: 590, y: 140 },
    { t: "Ajusta", x: 730, y: 220 },
  ];
  // Ruta (path) que se dibuja entre los hitos
  const pathD = steps
    .map((s, i) => {
      if (i === 0) return `M ${s.x} ${s.y}`;
      const prev = steps[i - 1];
      const cx = (prev.x + s.x) / 2;
      return `Q ${cx} ${prev.y - 30} ${s.x} ${s.y}`;
    })
    .join(" ");
  const draw = spring({ frame: frame - 16, fps, config: theme.spring.smooth });
  const pathLen = 800;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <Badge text="Estrategia" delay={2} />
          <Entrance delay={6}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 62,
                fontWeight: 600,
                color: theme.colors.white,
                letterSpacing: "-0.03em",
                textAlign: "center",
              }}
            >
              Una ruta clara.
            </div>
          </Entrance>
        </div>

        <Entrance delay={10} scaleFrom={0.93}>
          <GlassPanel width={920} height={420} padding={40} radius={26}>
            <svg width={840} height={340} viewBox="0 0 840 340">
              {/* Fondo de puntos dispersos que se calman */}
              {Array.from({ length: 26 }).map((_, i) => {
                const px = (i * 137) % 820 + 10;
                const py = (i * 89) % 300 + 20;
                const settle = interpolate(frame, [0, 40], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <circle
                    key={i}
                    cx={px + Math.sin(frame / 20 + i) * 8 * settle}
                    cy={py + Math.cos(frame / 24 + i) * 8 * settle}
                    r={2.5}
                    fill={`${theme.colors.light}33`}
                  />
                );
              })}
              {/* Ruta */}
              <path
                d={pathD}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray={pathLen}
                strokeDashoffset={pathLen * (1 - draw)}
              />
              {/* Hitos */}
              {steps.map((s, i) => {
                const p = spring({
                  frame: frame - 20 - i * 7,
                  fps,
                  config: theme.spring.bouncy,
                });
                return (
                  <g key={i}>
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={13 * p}
                      fill={i === 0 || i === steps.length - 1 ? theme.colors.primary : theme.colors.deepAlt}
                      stroke={theme.colors.primary}
                      strokeWidth={2.5}
                      opacity={p}
                    />
                    <text
                      x={s.x}
                      y={s.y + 44}
                      textAnchor="middle"
                      fill={theme.colors.textOnDark}
                      fontSize={21}
                      fontFamily={theme.fonts.body}
                      fontWeight={500}
                      opacity={p}
                    >
                      {s.t}
                    </text>
                  </g>
                );
              })}
            </svg>
          </GlassPanel>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Beat E — Integraciones (280–350)
 * Conexiones visuales entre nodos: el centro conecta con herramientas.
 */
export const BeatIntegrations: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tools = [
    { t: "YouTube", a: -90 },
    { t: "TikTok", a: -30 },
    { t: "Notion", a: 30 },
    { t: "Drive", a: 90 },
    { t: "Calendar", a: 150 },
    { t: "Slack", a: 210 },
  ];
  const R = 250;
  const coreP = spring({ frame, fps, config: theme.spring.bouncy });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Badge text="Integraciones" delay={2} />
          <Entrance delay={6}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 62,
                fontWeight: 600,
                color: theme.colors.white,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                maxWidth: 520,
              }}
            >
              Conecta tus
              <br />
              herramientas.
            </div>
          </Entrance>
          <Entrance delay={14}>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 26,
                color: theme.colors.textDim,
                maxWidth: 460,
                lineHeight: 1.5,
              }}
            >
              Tu contenido y tus datos, en un solo lugar.
            </div>
          </Entrance>
        </div>

        <div style={{ position: "relative", width: 600, height: 560 }}>
          {/* Conexiones */}
          <svg width={600} height={560} style={{ position: "absolute", inset: 0 }}>
            {tools.map((tl, i) => {
              const p = spring({
                frame: frame - 12 - i * 4,
                fps,
                config: theme.spring.smooth,
              });
              const rad = (tl.a * Math.PI) / 180;
              const x = 300 + Math.cos(rad) * R;
              const y = 280 + Math.sin(rad) * (R * 0.82);
              // Pulso que viaja por la conexión
              const pulseT = ((frame * 0.02 + i * 0.17) % 1);
              const px = 300 + (x - 300) * pulseT;
              const py = 280 + (y - 280) * pulseT;
              return (
                <g key={i}>
                  <line
                    x1={300}
                    y1={280}
                    x2={300 + (x - 300) * p}
                    y2={280 + (y - 280) * p}
                    stroke={`${theme.colors.primary}55`}
                    strokeWidth={2}
                  />
                  {p > 0.9 && (
                    <circle cx={px} cy={py} r={4} fill={theme.colors.light} opacity={0.8} />
                  )}
                </g>
              );
            })}
          </svg>
          {/* Centro HookHub */}
          <div
            style={{
              position: "absolute",
              left: 300 - 62,
              top: 280 - 62,
              width: 124,
              height: 124,
              borderRadius: 30,
              background: `linear-gradient(140deg, ${theme.colors.primary}, ${theme.colors.primaryDim})`,
              boxShadow: `0 0 56px ${theme.colors.glow}`,
              transform: `scale(${coreP})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: theme.fonts.display,
              fontWeight: 600,
              fontSize: 22,
              color: theme.colors.white,
              letterSpacing: "-0.02em",
            }}
          >
            HookHub
          </div>
          {/* Nodos */}
          {tools.map((tl, i) => {
            const p = spring({
              frame: frame - 16 - i * 4,
              fps,
              config: theme.spring.snappy,
            });
            const rad = (tl.a * Math.PI) / 180;
            const x = 300 + Math.cos(rad) * R;
            const y = 280 + Math.sin(rad) * (R * 0.82);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x - 58,
                  top: y - 26,
                  width: 116,
                  height: 52,
                  borderRadius: 14,
                  background: `${theme.colors.white}0E`,
                  border: `1px solid ${theme.colors.white}22`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: theme.fonts.body,
                  fontWeight: 500,
                  fontSize: 19,
                  color: theme.colors.light,
                  opacity: p,
                  transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
                }}
              >
                {tl.t}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Beat F — Video Studio (350–420)
 * Timeline con clips, cabezal que se mueve y oleada de audio.
 */
export const BeatStudio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cabezal de reproducción que avanza
  const head = interpolate(frame, [10, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.inOut,
  });
  const headX = 70 + head * 640;

  const clips = [
    { t: "Intro", w: 130, c: theme.colors.primary, x: 70 },
    { t: "B-roll", w: 170, c: `${theme.colors.light}44`, x: 210 },
    { t: "Voz", w: 200, c: `${theme.colors.primary}88`, x: 390 },
    { t: "Outro", w: 110, c: `${theme.colors.light}44`, x: 600 },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <Badge text="Video Studio" delay={2} />
          <Entrance delay={6}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 62,
                fontWeight: 600,
                color: theme.colors.white,
                letterSpacing: "-0.03em",
                textAlign: "center",
              }}
            >
              Produce sin salir.
            </div>
          </Entrance>
        </div>

        <Entrance delay={10} scaleFrom={0.93}>
          <GlassPanel width={1000} height={430} padding={36} radius={26}>
            {/* Preview */}
            <div
              style={{
                width: 928,
                height: 200,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${theme.colors.deepAlt}, ${theme.colors.primary}22)`,
                border: `1px solid ${theme.colors.white}12`,
                marginBottom: 24,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Play icon */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "30px solid rgba(255,255,255,0.85)",
                  borderTop: "19px solid transparent",
                  borderBottom: "19px solid transparent",
                  opacity: interpolate(frame, [14, 24], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              />
              {/* Marco de progreso del preview */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 3,
                  width: `${head * 100}%`,
                  background: theme.colors.primary,
                }}
              />
            </div>

            {/* Timeline */}
            <div
              style={{
                position: "relative",
                width: 928,
                height: 120,
                borderRadius: 12,
                background: `${theme.colors.white}06`,
                border: `1px solid ${theme.colors.white}10`,
                overflow: "hidden",
              }}
            >
              {/* Clips */}
              {clips.map((c, i) => {
                const p = spring({
                  frame: frame - 16 - i * 5,
                  fps,
                  config: theme.spring.smooth,
                });
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: c.x - 70,
                      top: 22,
                      width: c.w * p,
                      height: 44,
                      borderRadius: 8,
                      background: c.c,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 12,
                      fontFamily: theme.fonts.body,
                      fontSize: 16,
                      fontWeight: 500,
                      color: theme.colors.white,
                      opacity: p,
                      overflow: "hidden",
                    }}
                  >
                    {c.t}
                  </div>
                );
              })}
              {/* Pista de audio (waveform estilizada) */}
              <svg width={928} height={40} style={{ position: "absolute", bottom: 8, left: 0 }}>
                {Array.from({ length: 80 }).map((_, i) => {
                  const h =
                    (Math.sin(i * 0.6) * 0.4 + Math.sin(i * 1.7) * 0.3 + 0.5) * 26 * (i / 80);
                  return (
                    <rect
                      key={i}
                      x={40 + i * 10.5}
                      y={20 - h / 2}
                      width={4}
                      height={Math.max(2, h)}
                      rx={2}
                      fill={i / 80 < head ? theme.colors.primary : `${theme.colors.light}33`}
                    />
                  );
                })}
              </svg>
              {/* Cabezal */}
              <div
                style={{
                  position: "absolute",
                  left: headX - 70,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: theme.colors.white,
                  boxShadow: `0 0 10px ${theme.colors.white}`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: -6,
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: theme.colors.white,
                  }}
                />
              </div>
            </div>
          </GlassPanel>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};
