import React from "react";
import { Composition, Folder } from "remotion";
import { TechHatPromo } from "./TechHatPromo";
import { FPS, TOTAL_FRAMES } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main Full 85s Pre-Release SaaS Software Walkthrough Promo (with User Voiceover & Live UI) */}
      <Composition
        id="TechHatPromo"
        component={TechHatPromo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          hasVoiceover: true,
          voiceoverFile: "voiceover/voiceover.wav",
          startTimeOffset: 0,
          includeAudio: true,
        }}
      />

      {/* Connected Individual Feature Scenes for Quick Inspection in Remotion Studio */}
      <Folder name="Feature-Chapters">
        <Composition
          id="Feature1-Bangla-And-Office"
          component={TechHatPromo}
          durationInFrames={Math.round(15.1 * FPS)}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{
            startTimeOffset: 11.6,
            includeAudio: false,
          }}
        />
        <Composition
          id="Feature2-PDF-Studio"
          component={TechHatPromo}
          durationInFrames={Math.round(13.7 * FPS)}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{
            startTimeOffset: 26.7,
            includeAudio: false,
          }}
        />
        <Composition
          id="Feature3-Image-Scanner-Vector"
          component={TechHatPromo}
          durationInFrames={Math.round(19.9 * FPS)}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{
            startTimeOffset: 40.4,
            includeAudio: false,
          }}
        />
        <Composition
          id="Feature4-Dates-Age-Invoice-Utilities"
          component={TechHatPromo}
          durationInFrames={Math.round(12.5 * FPS)}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{
            startTimeOffset: 60.3,
            includeAudio: false,
          }}
        />
      </Folder>
    </>
  );
};
