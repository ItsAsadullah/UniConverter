"""Synthesize tactile Software Walkthrough SFX & warm ambient pad bed (48kHz Stereo WAV).

Modeled directly on the `ai-video-editor` Software Walkthrough WebAudio SFX engine:
- Warm synth pad bed (Dmaj7 -> Bm7 -> Gmaj7 -> A7) with soft hats
- Crisp mouse clicks, soft keyboard typing, UI pops, camera zoom swells,
  climbing 2-note step chimes (Steps 1..4), and success confirmation chimes.
"""
import math
import os
import wave
import numpy as np

SR = 48000
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "sfx")
os.makedirs(OUT_DIR, exist_ok=True)

SEMI = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}


def note_hz(note: str) -> float:
    name = note[0]
    sharp = 1 if "#" in note else (-1 if "b" in note else 0)
    octave = int(note[-1])
    semitones = SEMI[name] + sharp + (octave - 4) * 12
    return 440.0 * (2.0 ** (semitones / 12.0))


def save_wav(filename: str, left: np.ndarray, right: np.ndarray, max_peak: float = 0.85):
    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    if peak > max_peak:
        scale = max_peak / peak
        left = left * scale
        right = right * scale
    stereo = np.empty((left.size * 2,), dtype=np.int16)
    stereo[0::2] = np.clip(left * 32767.0, -32768, 32767).astype(np.int16)
    stereo[1::2] = np.clip(right * 32767.0, -32768, 32767).astype(np.int16)
    path = os.path.join(OUT_DIR, filename)
    with wave.open(path, "wb") as wv:
        wv.setnchannels(2)
        wv.setsampwidth(2)
        wv.setframerate(SR)
        wv.writeframes(stereo.tobytes())
    print(f"Generated {filename} ({left.size / SR:.2f}s)")


def exp_env(n: int, attack_s: float, hold_s: float = 0.0, end_db: float = -60.0) -> np.ndarray:
    na = max(1, min(n - 1, int(attack_s * SR)))
    nh = max(0, min(n - na - 1, int(hold_s * SR)))
    nd = max(1, n - na - nh)
    env = np.zeros(n, dtype=np.float64)
    env[:na] = np.linspace(0.0, 1.0, na)
    if nh > 0:
        env[na : na + nh] = 1.0
    env[na + nh :] = np.power(10.0, np.linspace(0.0, end_db / 20.0, nd))
    env[-1] = 0.0
    return env


def biquad_bandpass(sig: np.ndarray, f0: float, q: float = 2.0) -> np.ndarray:
    w0 = 2.0 * math.pi * f0 / SR
    alpha = math.sin(w0) / (2.0 * q)
    b0, b1, b2 = alpha, 0.0, -alpha
    a0, a1, a2 = 1.0 + alpha, -2.0 * math.cos(w0), 1.0 - alpha
    b0, b1, b2 = b0 / a0, b1 / a0, b2 / a0
    a1, a2 = a1 / a0, a2 / a0
    out = np.zeros_like(sig)
    x1 = x2 = y1 = y2 = 0.0
    for i in range(sig.size):
        x0 = float(sig[i])
        y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        out[i] = y0
        x2, x1 = x1, x0
        y2, y1 = y1, y0
    return out


def one_pole_lowpass(sig: np.ndarray, cutoff_hz: float) -> np.ndarray:
    rc = 1.0 / (2.0 * math.pi * cutoff_hz)
    dt = 1.0 / SR
    alpha = dt / (rc + dt)
    out = np.zeros_like(sig)
    y = 0.0
    for i in range(sig.size):
        y += alpha * (float(sig[i]) - y)
        out[i] = y
    return out


def simple_reverb(left: np.ndarray, right: np.ndarray, mix: float = 0.22) -> tuple[np.ndarray, np.ndarray]:
    delays_ms = [23.0, 37.0, 53.0, 79.0]
    gains = [0.42, 0.31, 0.22, 0.14]
    wet_l = np.zeros_like(left)
    wet_r = np.zeros_like(right)
    for idx, (d_ms, g) in enumerate(zip(delays_ms, gains)):
        d = int(d_ms * 0.001 * SR)
        if d < left.size:
            if idx % 2 == 0:
                wet_l[d:] += left[:-d] * g
                wet_r[d:] += right[:-d] * g * 0.85
            else:
                wet_l[d:] += right[:-d] * g * 0.85
                wet_r[d:] += left[:-d] * g
    return left + wet_l * mix, right + wet_r * mix


def gen_mouse_click():
    dur = 0.12
    n = int(dur * SR)
    rng = np.random.default_rng(101)
    # Transient 1 at t=0 (3200Hz bandpass)
    n1 = int(0.014 * SR)
    burst1 = biquad_bandpass(rng.uniform(-1, 1, n1), 3100.0, q=2.2) * exp_env(n1, 0.001)
    # Add subtle body thump (1100 -> 320Hz)
    t1 = np.arange(n1) / SR
    body1 = np.sin(2 * math.pi * (1100 * np.exp(-t1 * 90)) * t1) * exp_env(n1, 0.001) * 0.35
    # Transient 2 (release click at 45ms, 2300Hz bandpass)
    n2 = int(0.012 * SR)
    off2 = int(0.046 * SR)
    burst2 = biquad_bandpass(rng.uniform(-1, 1, n2), 2350.0, q=2.2) * exp_env(n2, 0.001) * 0.55

    sig = np.zeros(n, dtype=np.float64)
    sig[:n1] += burst1 + body1
    sig[off2 : off2 + n2] += burst2
    save_wav("mouse-click.wav", sig * 0.65, sig * 0.65, max_peak=0.72)


def gen_ui_pop(filename: str, base_freq: float, peak_gain: float = 0.45):
    dur = 0.11
    n = int(dur * SR)
    t = np.arange(n) / SR
    freqs = base_freq * (1.0 + 0.68 * np.exp(-t * 48.0))
    phase = 2.0 * math.pi * np.cumsum(freqs) / SR
    tone = np.sin(phase) * exp_env(n, 0.003)
    rng = np.random.default_rng(int(base_freq))
    nt = int(0.01 * SR)
    air = biquad_bandpass(rng.uniform(-1, 1, nt), 4200.0, q=1.5) * exp_env(nt, 0.001) * 0.18
    sig = tone * peak_gain
    sig[:nt] += air
    l, r = simple_reverb(sig, sig, mix=0.14)
    save_wav(filename, l, r, max_peak=peak_gain)


def gen_typing(filename: str, duration: float, seed: int):
    n = int(duration * SR)
    rng = np.random.default_rng(seed)
    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)
    t_cur = 0.02
    while t_cur < duration - 0.04:
        idx = int(t_cur * SR)
        nk = int(0.016 * SR)
        if idx + nk < n:
            ff = float(rng.uniform(2900.0, 3900.0))
            noise = biquad_bandpass(rng.uniform(-1, 1, nk), ff, q=2.8) * exp_env(nk, 0.001) * 0.28
            tk = np.arange(nk) / SR
            thud = np.sin(2 * math.pi * float(rng.uniform(1700, 2100)) * tk) * exp_env(nk, 0.001) * 0.06
            pan = float(rng.uniform(-0.25, 0.25))
            k_sig = noise + thud
            left[idx : idx + nk] += k_sig * (0.5 - pan * 0.5)
            right[idx : idx + nk] += k_sig * (0.5 + pan * 0.5)
        t_cur += float(rng.uniform(0.055, 0.095))
    save_wav(filename, left, right, max_peak=0.42)


def gen_cam_whoosh(filename: str, zoom_in: bool):
    dur = 0.42
    n = int(dur * SR)
    rng = np.random.default_rng(301 if zoom_in else 302)
    # Pink-ish filtered noise sweep
    white = rng.uniform(-1, 1, n)
    pink = one_pole_lowpass(white, 1800.0 if zoom_in else 1400.0)
    env = np.sin(np.linspace(0, math.pi, n)) ** 1.6
    # Subtle low-mid tone sweep
    t = np.arange(n) / SR
    f_start, f_end = (180.0, 340.0) if zoom_in else (320.0, 170.0)
    freqs = np.linspace(f_start, f_end, n)
    phase = 2.0 * math.pi * np.cumsum(freqs) / SR
    sub = np.sin(phase) * env * 0.08
    sig = (pink * env * 0.22) + sub
    pan = np.linspace(-0.35, 0.35, n) if zoom_in else np.linspace(0.35, -0.35, n)
    left = sig * (0.5 - 0.35 * pan)
    right = sig * (0.5 + 0.35 * pan)
    l, r = simple_reverb(left, right, mix=0.2)
    save_wav(filename, l, r, max_peak=0.32)


def gen_step_chimes():
    pairs = [
        ("step-chime-1.wav", "E5", "B5"),
        ("step-chime-2.wav", "F#5", "C#6"),
        ("step-chime-3.wav", "A5", "E6"),
        ("step-chime-4.wav", "B5", "F#6"),
    ]
    for fname, n1, n2 in pairs:
        dur = 0.75
        n = int(dur * SR)
        t = np.arange(n) / SR
        f1, f2 = note_hz(n1), note_hz(n2)
        v1 = (np.sin(2 * math.pi * f1 * t) + 0.25 * np.sin(2 * math.pi * f1 * 2 * t)) * exp_env(n, 0.005, 0.02)
        off = int(0.085 * SR)
        n_rem = n - off
        t2 = np.arange(n_rem) / SR
        v2 = (np.sin(2 * math.pi * f2 * t2) + 0.2 * np.sin(2 * math.pi * f2 * 2 * t2)) * exp_env(n_rem, 0.005, 0.04)
        sig = v1 * 0.22
        sig[off:] += v2 * 0.20
        l, r = simple_reverb(sig * 0.9, sig * 0.75, mix=0.32)
        save_wav(fname, l, r, max_peak=0.36)


def gen_success_chime():
    dur = 0.95
    n = int(dur * SR)
    notes = ["D5", "F#5", "A5", "D6"]
    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)
    for i, note in enumerate(notes):
        off = int(i * 0.055 * SR)
        nr = n - off
        t = np.arange(nr) / SR
        f = note_hz(note)
        voice = (np.sin(2 * math.pi * f * t) + 0.18 * np.sin(2 * math.pi * f * 2 * t)) * exp_env(nr, 0.005, 0.05) * 0.16
        pan = (i - 1.5) * 0.2
        left[off:] += voice * (0.5 - pan * 0.4)
        right[off:] += voice * (0.5 + pan * 0.4)
    l, r = simple_reverb(left, right, mix=0.35)
    save_wav("success-chime.wav", l, r, max_peak=0.38)


def gen_outro_chord():
    dur = 2.4
    n = int(dur * SR)
    notes = ["D4", "F#4", "A4", "C#5", "E5"]
    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)
    for i, note in enumerate(notes):
        off = int(i * 0.065 * SR)
        nr = n - off
        t = np.arange(nr) / SR
        f = note_hz(note)
        voice = (np.sin(2 * math.pi * f * t) + 0.3 * np.sin(2 * math.pi * f * 0.5 * t)) * exp_env(nr, 0.02, 0.25) * 0.14
        pan = (i - 2.0) * 0.22
        left[off:] += voice * (0.5 - pan * 0.4)
        right[off:] += voice * (0.5 + pan * 0.4)
    l, r = simple_reverb(left, right, mix=0.4)
    save_wav("outro-chord.wav", l, r, max_peak=0.42)


def triangle_wave(phase: np.ndarray) -> np.ndarray:
    return 2.0 * np.abs(2.0 * (phase / (2.0 * math.pi) - np.floor(phase / (2.0 * math.pi) + 0.5))) - 1.0


def gen_pad_bed(duration: float = 64.0):
    n = int(duration * SR)
    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)
    bpm = 84.0
    beat = 60.0 / bpm
    bar = beat * 4.0
    chords = [
        ["D3", "F#3", "A3", "C#4"],
        ["B2", "D3", "F#3", "A3"],
        ["G2", "B2", "D3", "F#3"],
        ["A2", "C#3", "E3", "G#3"],
    ]
    rng = np.random.default_rng(777)

    tb = 0.0
    bar_idx = 0
    while tb < duration - 0.2:
        ch = chords[bar_idx % len(chords)]
        seg_len = min(bar + 0.4, duration - tb)
        n_seg = int(seg_len * SR)
        i0 = int(tb * SR)
        t = np.arange(n_seg) / SR
        env = exp_env(n_seg, 0.45, max(0.0, seg_len - 1.1), end_db=-45.0)

        # Warm triangle pad voices
        for j, note in enumerate(ch):
            f = note_hz(note)
            # Slight detune for warmth
            w1 = triangle_wave(2 * math.pi * f * t)
            w2 = np.sin(2 * math.pi * (f * 1.003) * t)
            voice = one_pole_lowpass((w1 * 0.6 + w2 * 0.4) * env * 0.045, 1150.0)
            pan = (j - 1.5) * 0.28
            left[i0 : i0 + n_seg] += voice * (0.5 - pan * 0.4)
            right[i0 : i0 + n_seg] += voice * (0.5 + pan * 0.4)

        # Warm sub bass root (one octave below ch[0])
        f_bass = note_hz(ch[0]) * 0.5
        bass = np.sin(2 * math.pi * f_bass * t) * env * 0.075
        left[i0 : i0 + n_seg] += bass * 0.5
        right[i0 : i0 + n_seg] += bass * 0.5

        # Soft tactile hi-hats & gentle pulse during walkthrough (after 3.2s)
        if tb >= 2.8 and tb < duration - 4.0:
            for b in range(8):
                ts = tb + b * (beat / 2.0)
                ih = int(ts * SR)
                nh = int((0.028 if b % 2 else 0.042) * SR)
                if ih + nh < n:
                    hat = biquad_bandpass(rng.uniform(-1, 1, nh), 7600.0, q=1.8) * exp_env(nh, 0.001)
                    gain = 0.016 if b % 2 else 0.026
                    left[ih : ih + nh] += hat * gain * 0.48
                    right[ih : ih + nh] += hat * gain * 0.52
                # Very soft heartbeat kick on beat 0 and 4
                if b in (0, 4):
                    nk = int(0.18 * SR)
                    if ih + nk < n:
                        tk = np.arange(nk) / SR
                        fk = 110.0 * np.exp(-tk * 18.0) + 42.0
                        kick = np.sin(2 * math.pi * np.cumsum(fk) / SR) * exp_env(nk, 0.004) * 0.07
                        left[ih : ih + nk] += kick * 0.5
                        right[ih : ih + nk] += kick * 0.5

        tb += bar
        bar_idx += 1

    # Smooth fade in/out
    fade_in = int(1.0 * SR)
    fade_out = int(2.0 * SR)
    left[:fade_in] *= np.linspace(0, 1, fade_in)
    right[:fade_in] *= np.linspace(0, 1, fade_in)
    left[-fade_out:] *= np.linspace(1, 0, fade_out)
    right[-fade_out:] *= np.linspace(1, 0, fade_out)

    l, r = simple_reverb(left, right, mix=0.28)
    save_wav("pad-bed.wav", l, r, max_peak=0.38)


if __name__ == "__main__":
    gen_mouse_click()
    gen_ui_pop("ui-pop.wav", 680.0, 0.40)
    gen_ui_pop("ui-pop-hi.wav", 980.0, 0.32)
    gen_typing("typing-short.wav", 0.95, 42)
    gen_typing("typing-med.wav", 1.45, 99)
    gen_cam_whoosh("cam-whoosh-in.wav", True)
    gen_cam_whoosh("cam-whoosh-out.wav", False)
    gen_step_chimes()
    gen_success_chime()
    gen_outro_chord()
    gen_pad_bed(64.0)
    print("All SFX generated successfully in:", OUT_DIR)
