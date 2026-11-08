import React from "react";
import { Img, staticFile } from "remotion";
import { LIVE_SCREENS, WIN_H, WIN_W, WIN_X, WIN_Y } from "../timeline";
import { clamp, ez, MONO_STACK, SANS_STACK, span } from "./WalkthroughPrimitives";

export const AppWindowShell: React.FC<{ t: number }> = ({ t }) => {
  // Find active screen state and previous screen state for ultra-smooth crossfade
  let activeIdx = 0;
  for (let i = 0; i < LIVE_SCREENS.length; i++) {
    if (t >= LIVE_SCREENS[i].start) {
      activeIdx = i;
    }
  }
  const current = LIVE_SCREENS[activeIdx];
  const prev = activeIdx > 0 ? LIVE_SCREENS[activeIdx - 1] : null;
  const fadeProgress = ez.smooth(span(t, current.start, current.start + 0.22));
  const sameRoute = prev && prev.url.split("#")[0] === current.url.split("#")[0];

  const chromeH = 36;
  const shellTop = WIN_Y - chromeH;
  const shellH = WIN_H + chromeH;

  return (
    <div
      style={{
        position: "absolute",
        left: WIN_X,
        top: shellTop,
        width: WIN_W,
        height: shellH,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "#0e0e10",
        border: "1.5px solid rgba(255, 255, 255, 0.14)",
        boxShadow:
          "0 42px 110px rgba(0, 0, 0, 0.72), 0 12px 32px rgba(0, 0, 0, 0.48), 0 0 0 1px rgba(16, 185, 129, 0.16)",
        display: "flex",
        flexDirection: "column",
        fontFamily: SANS_STACK,
      }}
    >
      {/* Sleek 36px Browser Window Chrome Bar */}
      <div
        style={{
          height: chromeH,
          backgroundColor: "#141418",
          borderBottom: "1px solid #27272a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          flexShrink: 0,
        }}
      >
        {/* Traffic lights + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 7 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#febc2e" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#28c840" }} />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#a1a1aa",
              fontFamily: MONO_STACK,
            }}
          >
            TechHat Studio v2.0 — Live PWA
          </span>
        </div>

        {/* Live URL Address Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 16px",
            borderRadius: 8,
            backgroundColor: "#0e0e10",
            border: "1px solid #27272a",
            minWidth: 420,
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#10b981" }}>🔒</span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "#e4e4e7",
              fontFamily: MONO_STACK,
            }}
          >
            https://{current.url}
          </span>
        </div>

        {/* Right Live Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 999,
              backgroundColor: "rgba(59, 130, 246, 0.14)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              color: "#93c5fd",
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#3b82f6",
              }}
            />
            {current.badge}
          </div>
        </div>
      </div>

      {/* Exact 1600x920 Live Application Viewport (from http://localhost:4321) */}
      <div
        style={{
          position: "relative",
          width: WIN_W,
          height: WIN_H,
          backgroundColor: "#0e0e10",
          overflow: "hidden",
        }}
      >
        {prev && fadeProgress < 1 && (
          <Img
            src={staticFile(prev.image)}
            style={{
              position: "absolute",
              inset: 0,
              width: WIN_W,
              height: WIN_H,
              objectFit: "cover",
            }}
          />
        )}
        <Img
          src={staticFile(current.image)}
          style={{
            position: "absolute",
            inset: 0,
            width: WIN_W,
            height: WIN_H,
            objectFit: "cover",
            opacity: sameRoute ? 1 : clamp(fadeProgress),
          }}
        />
      </div>
    </div>
  );
};
