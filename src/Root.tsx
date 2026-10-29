import React from "react";
import { Composition } from "remotion";
import { theme } from "./theme";
import { PlaceOnReady } from "./videos/PlaceOnReady";

// 10本の動画を Composition として並べる。いまは置くだけの回だけ
export const Root: React.FC = () => (
  <>
    <Composition
      id="place-on-ready"
      component={PlaceOnReady}
      durationInFrames={theme.fps * theme.durationInSeconds}
      fps={theme.fps}
      width={theme.size}
      height={theme.size}
    />
  </>
);
