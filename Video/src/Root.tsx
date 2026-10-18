import { Composition } from "remotion";
import { Promo } from "./Promo";
import { FPS } from "./theme";

// Duración total: 50 s → 1500 frames.
export const DURATION = 1500;

export const Root: React.FC = () => {
  return (
    <Composition
      id="Promo"
      component={Promo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
