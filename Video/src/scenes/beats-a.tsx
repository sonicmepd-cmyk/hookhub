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
import { Eyebrow } from "../components/Type";

/**
 * Beat A — Analytics (0–70)
 * Gráficos conceptuales que se construyen progresivamente.
 */
export const BeatAnalytics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Barras que crecen con stagger
  const bars = [0.42, 0.66, 0.38, 0.85, 0.58, 0.94, 0.72];
  // Línea de tendencia que se dibuja
  const lineP = spring({ frame: frame - 30, fps, config: theme.spring.smooth });
  const pts = bars.map((b, i) => `${60 + i * 84},${210 - b * 170}`);
  const lineLen = 600;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Badge text="Analytics" delay={2} />
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
              Entiende qué
              <br />
              funciona.
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
              Retención, clics y tendencias, interpretados para ti.
            </div>
          </Entrance>
        </div>

        <Entrance delay={8} scaleFrom={0.92}>
          <GlassPanel width={720} height={420} padding={40} radius={26}>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 18,
                color: theme.colors.textDim,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Rendimiento · 30 días
            </div>
            <svg width={640} height={300} viewBox="0 0 640 300">
              {/* Rejilla */}
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1={40}
                  y1={40 + i * 56}
                  x2={620}
                  y2={40 + i * 56}
                  stroke={`${theme.colors.white}10`}
                  strokeWidth={1}
                />
              ))}
              {/* Barras */}
              {bars.map((b, i) => {
                const p = spring({
                  frame: frame - 6 - i * 3,
                  fps,
                  config: theme.spring.smooth,
                });
                const h = b * 170 * p;
                return (
                  <rect
                    key={i}
                    x={48 + i * 84}
                    y={210 - h}
                    width={44}
                    height={h}
                    rx={7}
                    fill={i === 5 ? theme.colors.primary : `${theme.colors.light}3A`}
                  />
                );
              })}
              {/* Línea de tendencia */}
              <polyline
                points={pts.join(" ")}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={lineLen}
                strokeDashoffset={lineLen * (1 - lineP)}
                opacity={0.9}
              />
            </svg>
          </GlassPanel>
        </Entrance>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Beat B — HookHub AI (70–140)
 * Composición de asistencia inteligente: núcleo + nodos proveedores.
 */
export const BeatAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes = [
    { label: "GPT", angle: -60 },
    { label: "Claude", angle: 0 },
    { label: "Gemini", angle: 60 },
    { label: "Llama", angle: 180 },
  ];
  const coreP = spring({ frame, fps, config: theme.spring.bouncy });
  const breathe = 1 + Math.sin(frame / 18) * 0.03;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 120 }}>
        {/* Núcleo IA */}
        <div style={{ position: "relative", width: 420, height: 420 }}>
          {/* Anillo orbit */}
          <div
            style={{
              position: "absolute",
              inset: 40,
              borderRadius: "50%",
              border: `1px dashed ${theme.colors.primary}44`,
              transform: `rotate(${frame * 0.4}deg)`,
            }}
          />
          {/* Conexiones */}
          <svg
            width={420}
            height={420}
            style={{ position: "absolute", inset: 0 }}
          >
            {nodes.map((n, i) => {
              const p = spring({
                frame: frame - 10 - i * 4,
                fps,
                config: theme.spring.smooth,
              });
              const rad = (n.angle * Math.PI) / 180;
              const cx = 210 + Math.cos(rad) * 150;
              const cy = 210 + Math.sin(rad) * 150;
              return (
                <line
                  key={i}
                  x1={210}
                  y1={210}
                  x2={210 + (cx - 210) * p}
                  y2={210 + (cy - 210) * p}
                  stroke={`${theme.colors.primary}66`}
                  strokeWidth={2}
                />
              );
            })}
          </svg>
          {/* Centro */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 130,
              height: 130,
              marginLeft: -65,
              marginTop: -65,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${theme.colors.primary}, ${theme.colors.primaryDim})`,
              boxShadow: `0 0 60px ${theme.colors.glow}`,
              transform: `scale(${coreP * breathe})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: theme.fonts.display,
              fontWeight: 600,
              fontSize: 40,
              color: theme.colors.white,
            }}
          >
            AI
          </div>
          {/* Nodos proveedores */}
          {nodes.map((n, i) => {
            const p = spring({
              frame: frame - 14 - i * 4,
              fps,
              config: theme.spring.snappy,
            });
            const rad = (n.angle * Math.PI) / 180;
            const cx = 210 + Math.cos(rad) * 150;
            const cy = 210 + Math.sin(rad) * 150;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx - 42,
                  top: cy - 24,
                  width: 84,
                  height: 48,
                  borderRadius: 12,
                  background: `${theme.colors.white}10`,
                  border: `1px solid ${theme.colors.white}22`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: theme.fonts.body,
                  fontWeight: 500,
                  fontSize: 18,
                  color: theme.colors.light,
                  opacity: p,
                  transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
                }}
              >
                {n.label}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Badge text="HookHub AI" delay={4} />
          <Entrance delay={8}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 62,
                fontWeight: 600,
                color: theme.colors.white,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                maxWidth: 560,
              }}
            >
              Elige tu modelo.
            </div>
          </Entrance>
          <Entrance delay={16}>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 26,
                color: theme.colors.textDim,
                maxWidth: 520,
                lineHeight: 1.5,
              }}
            >
              Asistencia con la proveedor de IA que prefieras, integrada en tu flujo.
            </div>
          </Entrance>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Beat C — Ideas y guiones (140–210)
 * Palabras dispersas que se transforman en estructura organizada.
 */
export const BeatScripts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Palabras que se reorganizan en outline
  const rows = [
    { t: "Gancho (0–3 s)", w: 1 },
    { t: "Desarrollo del problema", w: 0.92 },
    { t: "Prueba social", w: 0.78 },
    { t: "Cierre con CTA", w: 0.64 },
  ];
  const chaos = [
    { t: "¿hook?", x: -80, y: -70, r: -8 },
    { t: "historia", x: 90, y: -50, r: 6 },
    { t: " datos ", x: -60, y: 60, r: 4 },
    { t: "cta final", x: 70, y: 70, r: -5 },
  ];
  const morph = spring({ frame: frame - 18, fps, config: theme.spring.smooth });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 110 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Badge text="Ideas y guiones" delay={2} />
          <Entrance delay={6}>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 62,
                fontWeight: 600,
                color: theme.colors.white,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                maxWidth: 540,
              }}
            >
              De la idea al guion.
            </div>
          </Entrance>
          <Entrance delay={14}>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 26,
                color: theme.colors.textDim,
                maxWidth: 480,
                lineHeight: 1.5,
              }}
            >
              Desarrolla conceptos con estructura narrativa clara.
            </div>
          </Entrance>
        </div>

        <div style={{ position: "relative", width: 600, height: 400 }}>
          <Entrance delay={8} scaleFrom={0.92}>
            <GlassPanel width={600} height={400} padding={44} radius={26}>
              {/* Palabras en desorden → se disuelven */}
              {chaos.map((c, i) => {
                const fade = interpolate(morph, [0, 0.7], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 240 + c.x,
                      top: 160 + c.y,
                      fontFamily: theme.fonts.display,
                      fontSize: 30,
                      fontWeight: 500,
                      color: theme.colors.light,
                      opacity: fade * (0.55 + i * 0.1),
                      transform: `rotate(${c.r}deg)`,
                    }}
                  >
                    {c.t}
                  </div>
                );
              })}
              {/* Estructura ordenada que aparece */}
              {rows.map((r, i) => {
                const p = spring({
                  frame: frame - 26 - i * 6,
                  fps,
                  config: theme.spring.smooth,
                });
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 44,
                      top: 70 + i * 72,
                      width: 512 * r.w * p,
                      opacity: p,
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background:
                          i === 0
                            ? theme.colors.primary
                            : `${theme.colors.light}18`,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontFamily: theme.fonts.body,
                        fontWeight: 600,
                        fontSize: 16,
                        color: i === 0 ? theme.colors.white : theme.colors.textDim,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        height: 16,
                        borderRadius: 5,
                        background:
                          i === 0
                            ? `${theme.colors.primary}55`
                            : `${theme.colors.white}1F`,
                        flex: r.w,
                      }}
                    />
                    <div
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 19,
                        color: theme.colors.textOnDark,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.t}
                    </div>
                  </div>
                );
              })}
            </GlassPanel>
          </Entrance>
        </div>
      </div>
    </AbsoluteFill>
  );
};
