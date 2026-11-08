import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { AppWindowShell } from "./components/AppWindowShell";
import { SoundScore } from "./components/SoundScore";
import {
  CursorOverlay,
  DesktopWallpaper,
  FontStyles,
  getCameraAt,
  OutroOverlays,
  SpotlightOverlay,
  StepCalloutPill,
  TitleCardOverlay,
} from "./components/WalkthroughPrimitives";

export interface TechHatPromoProps {
  hasVoiceover?: boolean;
  voiceoverFile?: string;
  startTimeOffset?: number;
  includeAudio?: boolean;
}

export const TechHatPromo: React.FC<TechHatPromoProps> = ({
  hasVoiceover = true,
  voiceoverFile = "voiceover/voiceover.wav",
  startTimeOffset = 0,
  includeAudio = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = startTimeOffset + frame / fps;

  const { cx, cy, z } = getCameraAt(t);

  // Camera transform: center around (cx, cy) and zoom by z around (960, 540)
  const cameraTransform = `translate(960px, 540px) scale(${z}) translate(${-cx}px, ${-cy}px)`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0e0e10",
        overflow: "hidden",
      }}
    >
      <FontStyles />

      {/* 1. World Space (affected by 2D Camera Pan & Zoom) */}
      <div
        style={{
          position: "absolute",
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: cameraTransform,
        }}
      >
        <DesktopWallpaper t={t} />
        <AppWindowShell t={t} />
        <SpotlightOverlay t={t} />
        <CursorOverlay t={t} />
      </div>

      {/* 2. Screen-Space Overlays (Title Card, Step Callout Pill, Notification & Outro Card) */}
      <TitleCardOverlay t={t} />
      <StepCalloutPill t={t} />
      <OutroOverlays t={t} />

      {/* 3. Subtle Cinematic Edge Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.28) 100%)",
          pointerEvents: "none",
          zIndex: 70,
        }}
      />

      {/* 4. Synchronized Sound Score (Pad Bed + Clicks + Typing + Pops + Whooshes + Step Chimes + User Voiceover) */}
      {includeAudio && startTimeOffset === 0 && (
        <SoundScore
          hasVoiceover={hasVoiceover}
          voiceoverFile={voiceoverFile}
        />
      )}
    </AbsoluteFill>
  );
};
