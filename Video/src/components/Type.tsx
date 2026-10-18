import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * Revelado palabra por palabra. Cada palabra: fade + rise (2 propiedades),
 * con stagger. Nunca entra todo a la vez.
 */
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  size?: number;
  weight?: number;
  color?: string;
  align?: "left" | "center";
  highlight?: string[]; // palabras en color héroe
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  per = 3,
  size = 72,
  weight = 500,
  color = theme.colors.textOnDark,
  align = "center",
  highlight = [],
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: `${size * 0.24}px ${size * 0.26}px`,
        justifyContent: align === "center" ? "center" : "flex-start",
        fontFamily: theme.fonts.display,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: "-0.03em",
        ...style,
      }}
    >
      {words.map((word, i) => {
        const p = spring({
          frame: frame - delay - i * per,
          fps,
          config: theme.spring.smooth,
        });
        const isHi = highlight.includes(word.replace(/[.,:;¡!]/g, ""));
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              opacity: p,
              color: isHi ? theme.colors.primary : color,
              transform: `translateY(${interpolate(p, [0, 1], [size * 0.42, 0])}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

/**
 * Etiqueta pequeña en versalitas — para rótulos de escena / badges.
 */
export const Eyebrow: React.FC<{
  text: string;
  delay?: number;
  color?: string;
}> = ({ text, delay = 0, color = theme.colors.primary }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
        fontFamily: theme.fonts.body,
        fontWeight: 500,
        fontSize: 22,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color,
      }}
    >
      <span
        style={{
          width: 34,
          height: 2,
          background: color,
          borderRadius: 2,
        }}
      />
      {text}
    </div>
  );
};
