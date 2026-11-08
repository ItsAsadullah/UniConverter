import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { CLICK_TIMES, STEPS } from "../timeline";

export interface SoundScoreProps {
  hasVoiceover?: boolean;
  voiceoverFile?: string;
}

export const SoundScore: React.FC<SoundScoreProps> = ({
  hasVoiceover = true,
  voiceoverFile = "voiceover/voiceover.wav",
}) => {
  const { fps } = useVideoConfig();
  const f = (sec: number) => Math.max(0, Math.round(sec * fps));

  // Subtle UI pops aligned with screen & spotlight transitions
  const popTimes = [7.2, 14.9, 16.9, 22.4, 32.3, 36.6, 41.8, 57.5, 60.8, 66.0, 73.0, 77.1];
  const popHiTimes = [7.8, 19.0, 28.9, 43.9, 47.0, 52.9, 64.0, 68.7];
  const zoomInTimes = [7.1, 15.1, 17.0, 22.5, 31.4, 41.7, 57.6, 66.0];
  const zoomOutTimes = [11.1, 26.5, 40.2, 60.1, 73.1];
  const successTimes = [14.7, 22.3, 32.2, 36.5, 41.7, 57.4, 67.8];

  return (
    <>
      {/* 1. Warm Ambient Synth Pad Bed (ducked beneath the voiceover) */}
      <Audio
        src={staticFile("sfx/pad-bed.wav")}
        volume={hasVoiceover ? 0.18 : 0.34}
      />

      {/* 2. User Recorded Bengali Voiceover Track */}
      {hasVoiceover && (
        <Audio src={staticFile(voiceoverFile)} volume={1.0} />
      )}

      {/* 3. Crisp Mouse Clicks on every cursor action */}
      {CLICK_TIMES.map((sec, idx) => (
        <Sequence
          key={`click-${idx}`}
          from={f(sec)}
          durationInFrames={Math.ceil(0.2 * fps)}
          name={`Click @ ${sec.toFixed(1)}s`}
        >
          <Audio src={staticFile("sfx/mouse-click.wav")} volume={0.62} />
        </Sequence>
      ))}

      {/* 4. Climbing 2-Note Step Chimes (Steps 1..4) */}
      {STEPS.map((st) => (
        <Sequence
          key={`step-chime-${st.step}`}
          from={f(st.start + 0.05)}
          durationInFrames={Math.ceil(0.85 * fps)}
          name={`Step ${st.step} Chime`}
        >
          <Audio
            src={staticFile(`sfx/step-chime-${st.step}.wav`)}
            volume={0.44}
          />
        </Sequence>
      ))}

      {/* 5. Keyboard Typing Burst (Live Bijoy ⇄ Unicode Typing) */}
      <Sequence
        from={f(12.35)}
        durationInFrames={Math.ceil(1.8 * fps)}
        name="Typing: Bijoy Unicode Text"
      >
        <Audio src={staticFile("sfx/typing-med.wav")} volume={0.52} />
      </Sequence>

      {/* 6. UI Card & Spotlight Pops */}
      {popTimes.map((sec, idx) => (
        <Sequence
          key={`pop-${idx}`}
          from={f(sec)}
          durationInFrames={Math.ceil(0.2 * fps)}
        >
          <Audio src={staticFile("sfx/ui-pop.wav")} volume={0.38} />
        </Sequence>
      ))}
      {popHiTimes.map((sec, idx) => (
        <Sequence
          key={`pop-hi-${idx}`}
          from={f(sec)}
          durationInFrames={Math.ceil(0.2 * fps)}
        >
          <Audio src={staticFile("sfx/ui-pop-hi.wav")} volume={0.35} />
        </Sequence>
      ))}

      {/* 7. Smooth Camera Zoom Whooshes */}
      {zoomInTimes.map((sec, idx) => (
        <Sequence
          key={`zoom-in-${idx}`}
          from={f(sec)}
          durationInFrames={Math.ceil(0.5 * fps)}
        >
          <Audio src={staticFile("sfx/cam-whoosh-in.wav")} volume={0.32} />
        </Sequence>
      ))}
      {zoomOutTimes.map((sec, idx) => (
        <Sequence
          key={`zoom-out-${idx}`}
          from={f(sec)}
          durationInFrames={Math.ceil(0.5 * fps)}
        >
          <Audio src={staticFile("sfx/cam-whoosh-out.wav")} volume={0.32} />
        </Sequence>
      ))}

      {/* 8. Feature Result Confirmation Chimes */}
      {successTimes.map((sec, idx) => (
        <Sequence
          key={`success-${idx}`}
          from={f(sec)}
          durationInFrames={Math.ceil(1.0 * fps)}
          name={`Success Chime @ ${sec.toFixed(1)}s`}
        >
          <Audio src={staticFile("sfx/success-chime.wav")} volume={0.42} />
        </Sequence>
      ))}

      {/* 9. Final Outro Resolution Chord */}
      <Sequence
        from={f(77.2)}
        durationInFrames={Math.ceil(2.5 * fps)}
        name="Outro Resolution Chord"
      >
        <Audio src={staticFile("sfx/outro-chord.wav")} volume={0.48} />
      </Sequence>
    </>
  );
};
