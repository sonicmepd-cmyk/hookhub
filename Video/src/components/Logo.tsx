import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * Logotipo HookHub — marca reconstruida desde Web/public/favicon.svg:
 * gancho (path) + punto azul. Aquí en tratamiento cinematográfico sobre
 * losazul profundo. NO es un logotipo oficial definitivo: es el existente
 * del proyecto, adaptado para motion.
 */
export const HookMark: React.FC<{
  size?: number;
  delay?: number;
  drawDelay?: number;
}> = ({ size = 120, delay = 0, drawDelay = 6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - delay,
    fps,
    config: theme.spring.bouncy,
  });
  // El trazo del gancho se "dibuja" (stroke-dashoffset)
  const draw = spring({
    frame: frame - delay - drawDelay,
    fps,
    config: theme.spring.smooth,
  });
  const dot = spring({
    frame: frame - delay - drawDelay - 8,
    fps,
    config: theme.spring.bouncy,
  });
  const s = size;
  const strokeLen = 46; // longitud aproximada del path del gancho
  return (
    <div
      style={{
        width: s,
        height: s,
        transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})`,
        opacity: pop,
        filter: `drop-shadow(0 0 ${s * 0.28}px ${theme.colors.glow})`,
      }}
    >
      <svg viewBox="0 0 32 32" width={s} height={s} fill="none">
        {/* Base del tile */}
        <rect
          width="32"
          height="32"
          rx="8"
          fill={theme.colors.deepAlt}
          stroke={`${theme.colors.primary}55`}
          strokeWidth="0.5"
        />
        {/* Gancho */}
        <path
          d="M10 8v10a6 6 0 0 0 12 0"
          stroke={theme.colors.white}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={strokeLen}
          strokeDashoffset={strokeLen * (1 - draw)}
        />
        {/* Punto héroe */}
        <circle
          cx="22"
          cy="10"
          r="2.5"
          fill={theme.colors.primary}
          opacity={dot}
          transform={`translate(22 10) scale(${interpolate(dot, [0, 1], [0, 1])}) translate(-22 -10)`}
        />
      </svg>
    </div>
  );
};

/**
 * Lockup completo: marca + wordmark "HookHub".
 * Wordmark entra letra/ sílaba a sílaba con stagger.
 */
export const LogoLockup: React.FC<{
  markSize?: number;
  wordSize?: number;
  delay?: number;
  showWord?: boolean;
  color?: string;
}> = ({
  markSize = 110,
  wordSize = 96,
  delay = 0,
  showWord = true,
  color = theme.colors.white,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letters = "HookHub".split("");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: markSize * 0.42,
      }}
    >
      <HookMark size={markSize} delay={delay} />
      {showWord && (
        <div
          style={{
            display: "flex",
            fontFamily: theme.fonts.display,
            fontWeight: 600,
            fontSize: wordSize,
            letterSpacing: "-0.035em",
            color,
            lineHeight: 1,
          }}
        >
          {letters.map((ch, i) => {
            const p = spring({
              frame: frame - delay - 6 - i * 2,
              fps,
              config: theme.spring.smooth,
            });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [wordSize * 0.35, 0])}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
