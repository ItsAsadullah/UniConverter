import React from "react";
import { staticFile } from "remotion";
import {
  CAM_KEYS,
  CLICK_TIMES,
  CURSOR_KEYS,
  SPOTLIGHTS,
  STEPS,
} from "../timeline";

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const span = (t: number, a: number, b: number) =>
  clamp((t - a) / Math.max(1e-6, b - a));

export const ez = {
  smooth: (u: number) => {
    const x = clamp(u);
    return x * x * (3 - 2 * x);
  },
  out3: (u: number) => 1 - Math.pow(1 - clamp(u), 3),
  in3: (u: number) => {
    const x = clamp(u);
    return x * x * x;
  },
  inout3: (u: number) => {
    const x = clamp(u);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  },
  outExpo: (u: number) => {
    const x = clamp(u);
    return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },
  back: (u: number, s = 1.7) => {
    const x = clamp(u);
    return x <= 0
      ? 0
      : x >= 1
      ? 1
      : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  },
};

export const typedText = (full: string, t: number, a: number, b: number) => {
  const u = span(t, a, b);
  return full.slice(0, Math.floor(full.length * u));
};

export function getCameraAt(t: number): { cx: number; cy: number; z: number } {
  if (t <= CAM_KEYS[0].t) {
    return { cx: CAM_KEYS[0].cx, cy: CAM_KEYS[0].cy, z: CAM_KEYS[0].z };
  }
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    if (t <= b.t) {
      const e = ez.inout3((t - a.t) / Math.max(1e-6, b.t - a.t));
      return {
        cx: lerp(a.cx, b.cx, e),
        cy: lerp(a.cy, b.cy, e),
        z: lerp(a.z, b.z, e),
      };
    }
  }
  const last = CAM_KEYS[CAM_KEYS.length - 1];
  return { cx: last.cx, cy: last.cy, z: last.z };
}

export function getCursorAt(t: number): { x: number; y: number; alpha: number } {
  const first = CURSOR_KEYS[0];
  const last = CURSOR_KEYS[CURSOR_KEYS.length - 1];
  const alpha =
    span(t, first.t, first.t + 0.35) * (1 - span(t, last.t, last.t + 0.4));
  if (t <= first.t) return { x: first.x, y: first.y, alpha };
  for (let i = 0; i < CURSOR_KEYS.length - 1; i++) {
    const a = CURSOR_KEYS[i];
    const b = CURSOR_KEYS[i + 1];
    if (t <= b.t) {
      const e = ez.inout3((t - a.t) / Math.max(1e-6, b.t - a.t));
      return {
        x: lerp(a.x, b.x, e),
        y: lerp(a.y, b.y, e),
        alpha,
      };
    }
  }
  return { x: last.x, y: last.y, alpha };
}

export const FontStyles: React.FC = () => {
  const kalpurush = staticFile("fonts/Kalpurush.ttf");
  const sutonny = staticFile("fonts/SutonnyMJ-Regular.ttf");
  const dmSans = staticFile("fonts/dm-sans-700.ttf");
  const inter700 = staticFile("fonts/inter-700.ttf");

  return (
    <style>
      {`
        @font-face {
          font-family: 'Kalpurush';
          src: url('${kalpurush}') format('truetype');
          font-weight: 400 700;
        }
        @font-face {
          font-family: 'SutonnyMJ';
          src: url('${sutonny}') format('truetype');
          font-weight: 400 700;
        }
        @font-face {
          font-family: 'DM Sans';
          src: url('${dmSans}') format('truetype');
          font-weight: 700;
        }
        @font-face {
          font-family: 'Inter';
          src: url('${inter700}') format('truetype');
          font-weight: 700;
        }
      `}
    </style>
  );
};

export const SANS_STACK =
  '"DM Sans", "Inter", "Kalpurush", "Nirmala UI", system-ui, sans-serif';
export const MONO_STACK =
  '"JetBrains Mono", "Consolas", ui-monospace, monospace';

// Desktop gradient wallpaper with two slow light blooms (Software Walkthrough signature look)
export const DesktopWallpaper: React.FC<{ t: number }> = ({ t }) => {
  const bx1 = 420 + Math.sin(t * 0.3) * 110;
  const by2 = 920 + Math.cos(t * 0.25) * 65;

  return (
    <div
      style={{
        position: "absolute",
        inset: -500,
        background:
          "linear-gradient(135deg, #2d3278 0%, #1e5b7a 52%, #137a6d 100%)",
      }}
    >
      {/* Subtle architectural dot grid on desktop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.09) 1.5px, transparent 1.5px)",
          backgroundSize: "36px 36px",
        }}
      />
      {/* Light bloom 1 */}
      <div
        style={{
          position: "absolute",
          left: bx1,
          top: 160,
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Light bloom 2 */}
      <div
        style={{
          position: "absolute",
          left: 1450,
          top: by2,
          width: 980,
          height: 980,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(110,255,214,0.16) 0%, rgba(110,255,214,0) 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

// Yellow-edged spotlight cutout around the active control/result
export const SpotlightOverlay: React.FC<{ t: number }> = ({ t }) => {
  const active = SPOTLIGHTS.find(
    (s) => t >= s.start - 0.25 && t <= s.end + 0.3
  );
  if (!active) return null;

  const alpha =
    ez.outExpo(span(t, active.start - 0.25, active.start + 0.15)) *
    (1 - ez.in3(span(t, active.end, active.end + 0.3)));
  if (alpha <= 0.01) return null;

  return (
    <svg
      width={2920}
      height={2080}
      viewBox="-500 -500 2920 2080"
      style={{
        position: "absolute",
        left: -500,
        top: -500,
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      <path
        fillRule="evenodd"
        fill={`rgba(10, 12, 24, ${0.42 * alpha})`}
        d={`M -500 -500 H 2420 V 1580 H -500 Z M ${active.x} ${
          active.y + 18
        } a 18 18 0 0 1 18 -18 h ${active.w - 36} a 18 18 0 0 1 18 18 v ${
          active.h - 36
        } a 18 18 0 0 1 -18 18 h -${active.w - 36} a 18 18 0 0 1 -18 -18 Z`}
      />
      <rect
        x={active.x}
        y={active.y}
        width={active.w}
        height={active.h}
        rx={18}
        fill="none"
        stroke={`rgba(255, 214, 10, ${alpha})`}
        strokeWidth={4}
      />
    </svg>
  );
};

// Realistic Software Walkthrough cursor with click dip and accent ripples
export const CursorOverlay: React.FC<{ t: number }> = ({ t }) => {
  const { x, y, alpha } = getCursorAt(t);
  if (alpha <= 0.01) return null;

  const isPressed = CLICK_TIMES.some((ct) => t >= ct - 0.02 && t <= ct + 0.12);
  const arrowScale = isPressed ? 0.86 : 1.05;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: alpha,
        zIndex: 50,
      }}
    >
      {/* Click ripples */}
      {CLICK_TIMES.map((ct, idx) => {
        const r = span(t, ct, ct + 0.52);
        if (r <= 0 || r >= 1) return null;
        const rad = 12 + 48 * ez.out3(r);
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: x - rad,
              top: y - rad,
              width: rad * 2,
              height: rad * 2,
              borderRadius: "50%",
              border: `3.5px solid rgba(91, 91, 246, ${0.92 * (1 - r)})`,
              backgroundColor: `rgba(16, 185, 129, ${0.22 * (1 - r)})`,
            }}
          />
        );
      })}

      {/* Cursor arrow SVG */}
      <svg
        width={44}
        height={48}
        viewBox="0 0 28 32"
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `scale(${arrowScale})`,
          transformOrigin: "0px 0px",
          filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.35))",
        }}
      >
        <path
          d="M 1 1 L 1 25 L 7 19.5 L 11.5 29 L 15.5 27.2 L 11 17.8 L 19 17.8 Z"
          fill="#111318"
          stroke="#ffffff"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// Intro Title Card (7.2s -> 11.4s: "পরিচয় করিয়ে দিচ্ছি—টেকহ্যাট স্টুডিও টু পয়েন্ট ও!")
export const TitleCardOverlay: React.FC<{ t: number }> = ({ t }) => {
  if (t < 7.1 || t >= 11.45) return null;
  const inn = ez.outExpo(span(t, 7.1, 7.65));
  const out = ez.in3(span(t, 10.85, 11.4));
  const alpha = inn * (1 - out);
  if (alpha <= 0.01) return null;

  const tagAlpha = span(t, 7.15, 7.55);
  const line1 = ez.outExpo(span(t, 7.25, 7.85));
  const line2 = ez.outExpo(span(t, 7.5, 8.1));
  const pill = ez.outExpo(span(t, 7.8, 8.4));
  const badges = ez.outExpo(span(t, 8.05, 8.65));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `rgba(10, 12, 20, ${0.72 * alpha})`,
        backdropFilter: "blur(8px)",
        opacity: alpha,
        transform: `translateY(${-60 * out}px)`,
        fontFamily: SANS_STACK,
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      {/* Top Brand Logo + Pre-Release Tag */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: tagAlpha,
          marginBottom: 22,
          padding: "10px 24px",
          borderRadius: 999,
          backgroundColor: "rgba(15, 23, 42, 0.78)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
        }}
      >
        <img
          src={staticFile("icons/icon-192.png")}
          alt=""
          style={{ width: 34, height: 34, borderRadius: 9 }}
        />
        <span
          style={{
            fontFamily: MONO_STACK,
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: "4px",
            color: "#6ee7b7",
          }}
        >
          PRE-RELEASE ANNOUNCEMENT · VERSION 2.0
        </span>
      </div>

      {/* Line 1 Rise */}
      <div style={{ overflow: "hidden", padding: "4px 24px" }}>
        <div
          style={{
            fontSize: 108,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            lineHeight: 1.08,
            transform: `translateY(${(1 - line1) * 110}px)`,
            opacity: Math.min(1, line1 * 1.5),
            textShadow: "0 14px 40px rgba(0,0,0,0.45)",
          }}
        >
          TechHat <span style={{ color: "#3b82f6" }}>Studio 2.0</span>
        </div>
      </div>

      {/* Line 2 Rise (Bengali Subtitle) */}
      <div style={{ overflow: "hidden", padding: "8px 24px", marginTop: 4 }}>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#f1f5f9",
            lineHeight: 1.25,
            transform: `translateY(${(1 - line2) * 75}px)`,
            opacity: Math.min(1, line2 * 1.5),
          }}
        >
          ডকুমেন্ট, পিডিএফ ও অফিস প্রোডাক্টিভিটি স্যুট
        </div>
      </div>

      {/* Step & Offline Meta Pill */}
      <div
        style={{
          marginTop: 26,
          opacity: pill,
          transform: `scale(${0.92 + 0.08 * pill})`,
          padding: "14px 36px",
          borderRadius: 999,
          backgroundColor: "rgba(37, 99, 235, 0.22)",
          border: "1.5px solid rgba(96, 165, 250, 0.45)",
          fontFamily: MONO_STACK,
          fontSize: 23,
          fontWeight: 700,
          letterSpacing: "3px",
          color: "#ffffff",
        }}
      >
        5 CORE STUDIOS · 27+ PRO TOOLS · 100% CLIENT-SIDE & OFFLINE
      </div>

      {/* 4 Core Pillar Chips */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 26,
          opacity: badges,
          transform: `translateY(${(1 - badges) * 24}px)`,
        }}
      >
        {[
          { label: "১. বিজয় ⇄ ইউনিকোড ও অফিস ফাইল", col: "#818cf8" },
          { label: "২. ৮-ইন-১ পিডিএফ স্টুডিও", col: "#fb7185" },
          { label: "৩. NID, পাসপোর্ট স্ক্যানার ও ভেক্টর", col: "#38bdf8" },
          { label: "৪. ক্যালেন্ডার, বয়স ও ইনভয়েস মেকার", col: "#34d399" },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              padding: "10px 22px",
              borderRadius: 14,
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: `1.5px solid ${b.col}`,
              color: "#ffffff",
              fontSize: 21,
              fontWeight: 700,
            }}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// Bottom-left numbered Step Callout Pill (Software Walkthrough signature chrome)
export const StepCalloutPill: React.FC<{ t: number }> = ({ t }) => {
  const step = STEPS.find((s) => t >= s.start && t < s.end);
  if (!step) return null;

  const inn = ez.outExpo(span(t, step.start, step.start + 0.45));
  const out = ez.in3(span(t, 72.2, 72.6));
  const alpha = (step.step === 1 ? inn : 1) * (1 - out);
  if (alpha <= 0.01) return null;

  const badgeScale = ez.back(inn, 2.1);

  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        bottom: 36,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "14px 28px 14px 18px",
        borderRadius: 999,
        backgroundColor: "rgba(14, 16, 26, 0.94)",
        border: "1.5px solid rgba(255, 255, 255, 0.16)",
        boxShadow: "0 18px 42px rgba(0, 0, 0, 0.48)",
        opacity: alpha,
        transform: `translateX(${
          -60 * (1 - (step.step === 1 ? inn : 1)) - 70 * out
        }px)`,
        fontFamily: SANS_STACK,
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      {/* Number Circle */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: step.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontFamily: MONO_STACK,
          fontSize: 26,
          fontWeight: 800,
          transform: `scale(${badgeScale})`,
          boxShadow: `0 0 20px ${step.accent}88`,
        }}
      >
        {step.step}
      </div>

      {/* Step Title & Sub-label */}
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            transform: `translateY(${(1 - inn) * 36}px)`,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            {step.titleBn}
          </span>
          <span
            style={{
              fontFamily: MONO_STACK,
              fontSize: 20,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {step.step}/{step.total}
          </span>
        </div>
        <div
          style={{
            fontSize: 16.5,
            fontWeight: 600,
            color: "#94a3b8",
            marginTop: 2,
            transform: `translateY(${(1 - inn) * 28}px)`,
          }}
        >
          {step.subEn}
        </div>
      </div>
    </div>
  );
};

// Top-right Notification Card + Bottom-left Outro Lower-Third (73.0s -> 85.0s)
export const OutroOverlays: React.FC<{ t: number }> = ({ t }) => {
  const notifA =
    ez.outExpo(span(t, 73.0, 73.6)) * (1 - ez.in3(span(t, 84.3, 84.9)));
  const cardA = ez.outExpo(span(t, 77.0, 77.6));
  const checkP = ez.back(span(t, 77.2, 77.8), 2.2);
  const w1 = ez.outExpo(span(t, 77.3, 77.9));
  const w2 = ez.outExpo(span(t, 77.6, 78.2));

  return (
    <>
      {notifA > 0.01 && (
        <div
          style={{
            position: "absolute",
            right: 54,
            top: 38,
            width: 590,
            padding: "18px 24px",
            borderRadius: 22,
            backgroundColor: "rgba(18, 20, 28, 0.96)",
            border: "1.5px solid rgba(52, 211, 153, 0.45)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            gap: 18,
            transform: `translateX(${(1 - notifA) * 540}px)`,
            fontFamily: SANS_STACK,
            zIndex: 65,
          }}
        >
          <img
            src={staticFile("icons/icon-192.png")}
            alt=""
            style={{ width: 56, height: 56, borderRadius: 14 }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 23,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              ১০০% প্রাইভেসি · কোনো ফাইল আপলোড ছাড়াই
            </div>
            <div
              style={{
                fontSize: 18.5,
                fontWeight: 600,
                color: "#34d399",
                marginTop: 4,
              }}
            >
              ✓ সম্পূর্ণ ব্রাউজার-ভিত্তিক ও অফলাইন সাপোর্ট রেডি
            </div>
          </div>
        </div>
      )}

      {cardA > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 38,
            padding: "24px 40px",
            borderRadius: 28,
            backgroundColor: "rgba(14, 16, 26, 0.96)",
            border: "2px solid rgba(59, 130, 246, 0.55)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            gap: 24,
            opacity: cardA,
            transform: `translateX(${-80 * (1 - cardA)}px)`,
            fontFamily: SANS_STACK,
            zIndex: 65,
          }}
        >
          {/* Animated Green Checkmark */}
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              backgroundColor: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${checkP})`,
              boxShadow: "0 0 28px rgba(16, 185, 129, 0.55)",
            }}
          >
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="#ffffff"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: "#ffffff",
                opacity: w1,
                transform: `translateY(${(1 - w1) * 24}px)`,
              }}
            >
              TechHat <span style={{ color: "#3b82f6" }}>Studio 2.0</span> — খুব শীঘ্রই আসছে!
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.82)",
                marginTop: 6,
                opacity: w2,
                transform: `translateY(${(1 - w2) * 20}px)`,
              }}
            >
              ২৭+ প্রো টুলস · ১০০% ফ্রি ও অফলাইন · প্রি-রিলিজ আপডেট পেতে আজই যুক্ত থাকুন!
            </div>
          </div>
        </div>
      )}
    </>
  );
};
