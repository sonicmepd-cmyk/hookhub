import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { FontFaces } from "./components/FontFaces";
import { Grade } from "./components/Layers";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { MusicTrack, VoiceTrack, SfxTrack } from "./audio/Tracks";
import { S1, S2, S3, S4, S5, S6 } from "./audio/timeline";

/**
 * Promo — anuncio de lanzamiento de HookHub.
 * 1500 frames @ 30 fps = 50 s. 1920×1080.
 *
 * Arquitectura de capas (por escena):
 *   BgMesh → contenido → Grade (global) → Grain + Vignette (por escena)
 */
export const Promo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0B1F44" }}>
      <FontFaces />

      {/* Música con ducking + narración + SFX */}
      <MusicTrack />
      <VoiceTrack />
      <SfxTrack />

      {/* Escenas */}
      <Sequence from={S1.from} durationInFrames={S1.dur} layout="none">
        <Scene1 />
      </Sequence>
      <Sequence from={S2.from} durationInFrames={S2.dur} layout="none">
        <Scene2 />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.dur} layout="none">
        <Scene3 />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.dur} layout="none">
        <Scene4 />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.dur} layout="none">
        <Scene5 />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.dur} layout="none">
        <Scene6 />
      </Sequence>

      {/* Grade global — unifica todas las escenas */}
      <Grade />
    </AbsoluteFill>
  );
};
