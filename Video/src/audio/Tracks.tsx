import React from "react";
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { VO, SFX, DUCK_LEVEL, DUCK_RAMP } from "./timeline";

/**
 * Curva de ducking determinista: la mÃºsica baja mientras hay voz.
 * Se calcula por fotogramas â€” sin estados aleatorios.
 */
const useMusicVolume = (): ((f: number) => number) => {
  const frame = useCurrentFrame();
  void frame;
  return (f: number) => {
    let duck = 1;
    for (const v of VO) {
      const start = v.from - 6;
      const end = v.from + v.dur + 4;
      if (f >= start - DUCK_RAMP && f <= end + DUCK_RAMP) {
        // Rampa de subida/bajada
        let local = 1;
        if (f < start) {
          local = interpolate(f, [start - DUCK_RAMP, start], [1, DUCK_LEVEL], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        } else if (f > end) {
          local = interpolate(f, [end, end + DUCK_RAMP], [DUCK_LEVEL, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        } else {
          local = DUCK_LEVEL;
        }
        duck = Math.min(duck, local);
      }
    }
    return duck;
  };
};

/** MÃºsica de fondo con ducking bajo la narraciÃ³n. */
export const MusicTrack: React.FC = () => {
  const volAt = useMusicVolume();
  return (
    <Audio
      src={staticFile("audio/music.wav")}
      volume={(f) => 0.52 * volAt(f)}
    />
  );
};

/** NarraciÃ³n â€” frases colocadas frame a frame. */
export const VoiceTrack: React.FC = () => (
  <>
    {VO.map((v) => (
      <Sequence key={v.id} from={v.from} durationInFrames={v.dur + 6} layout="none">
        <Audio
          src={staticFile(`audio/vo/${v.id}.wav`)}
          volume={0.86}
        />
      </Sequence>
    ))}
  </>
);

/** Efectos sincronizados con acciones visuales concretas. */
export const SfxTrack: React.FC = () => (
  <>
    {SFX.map((s, i) => (
      <Sequence key={`${s.id}-${i}`} from={s.from} layout="none">
        <Audio
          src={staticFile(`audio/sfx/${s.id}.wav`)}
          volume={s.vol}
        />
      </Sequence>
    ))}
  </>
);
