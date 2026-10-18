import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { BgMesh, Grain, Vignette } from "../components/Layers";
import { useExit } from "../components/Ui";
import { S4, BEAT_DUR } from "../audio/timeline";
import {
  BeatAnalytics,
  BeatAI,
  BeatScripts,
} from "./beats-a";
import {
  BeatStrategy,
  BeatIntegrations,
  BeatStudio,
} from "./beats-b";

const BEATS = [
  BeatAnalytics,
  BeatAI,
  BeatScripts,
  BeatStrategy,
  BeatIntegrations,
  BeatStudio,
];

// Traslape entre beats: el anterior hace cross-fade de salida mientras
// el siguiente entra, para que el cambio nunca deje un frame vacío.
const BEAT_OVERLAP = 20;

/**
 * Escena 4 — Lo que hace posible (20–34 s / 420 frames)
 * Seis micro-momentos, cada uno con lenguaje visual propio.
 * Cada beat entra con un pequeño "whip" de escala, no tarjetas idénticas.
 */
export const Scene4: React.FC = () => {
  return (
    <AbsoluteFill>
      <BgMesh />
      {BEATS.map((Beat, i) => {
        const from = i === 0 ? 0 : i * BEAT_DUR - BEAT_OVERLAP;
        const durationInFrames = i === 0 ? BEAT_DUR : BEAT_DUR + BEAT_OVERLAP;
        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={durationInFrames}
            layout="none"
          >
            <BeatWrap
              durationInFrames={durationInFrames}
              exit={i < BEATS.length - 1}
            >
              <Beat />
            </BeatWrap>
          </Sequence>
        );
      })}
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};

// Envoltorio: el beat sale desvaneciéndose durante el traslape con el
// siguiente (el último beat corta en el cambio de escena).
const BeatWrap: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  exit?: boolean;
}> = ({ children, durationInFrames, exit = true }) => {
  const ex = useExit(durationInFrames, BEAT_OVERLAP);
  return (
    <AbsoluteFill style={exit ? ex : undefined}>{children}</AbsoluteFill>
  );
};

void S4;
