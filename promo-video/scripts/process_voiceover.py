import os
import subprocess
import wave
import numpy as np

RAW_WAV = r"d:\TechHat website\Bijoy Converter\promo-video\public\voiceover\voiceover-raw.wav"
OUT_WAV = r"d:\TechHat website\Bijoy Converter\promo-video\public\voiceover\voiceover.wav"
OUT_MP3 = r"d:\TechHat website\Bijoy Converter\promo-video\public\voiceover\voiceover.mp3"
SFX_DIR = r"d:\TechHat website\Bijoy Converter\promo-video\public\sfx"

with wave.open(RAW_WAV, "rb") as wf:
    sr = wf.getframerate()
    n = wf.getnframes()
    audio = np.frombuffer(wf.readframes(n), dtype=np.int16).reshape(-1, 2).astype(np.float32) / 32768.0

# Smoothly mute the small chuckle between sentences at 10.84s .. 11.58s
def mute_window(arr, t0, t1, fade=0.03):
    s0 = int(t0 * sr)
    s1 = int(t1 * sr)
    sf = int(fade * sr)
    env = np.ones(s1 - s0, dtype=np.float32)
    env[:sf] = np.linspace(1.0, 0.0, sf)
    env[sf:-sf] = 0.0
    env[-sf:] = np.linspace(0.0, 1.0, sf)
    arr[s0:s1, 0] *= env
    arr[s0:s1, 1] *= env

mute_window(audio, 10.84, 11.58, fade=0.03)

# Gentle broadcast normalization (soft knee + peak normalize to 0.88)
peak = np.max(np.abs(audio))
if peak > 0:
    audio = audio / peak * 0.90

pcm = (np.clip(audio, -1.0, 1.0) * 32767.0).astype(np.int16)
with wave.open(OUT_WAV, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    wf.writeframes(pcm.tobytes())

subprocess.run(["ffmpeg", "-y", "-i", OUT_WAV, "-b:a", "192k", OUT_MP3], check=True, capture_output=True)
print("Saved cleaned voiceover:", OUT_WAV, "and", OUT_MP3)

# Also regenerate pad-bed.wav for 86.0 seconds so it covers the full 85s video
dur = 86.0
t = np.linspace(0, dur, int(sr * dur), endpoint=False)
freqs = [130.81, 196.00, 246.94, 293.66, 392.00]
pad_l = np.zeros_like(t)
pad_r = np.zeros_like(t)
for i, f in enumerate(freqs):
    mod = 1.0 + 0.0018 * np.sin(2 * np.pi * (0.14 + 0.04 * i) * t)
    s1 = np.sin(2 * np.pi * f * mod * t + i * 0.6)
    s2 = np.sin(2 * np.pi * (f * 1.002) * t + i * 1.2)
    pan = 0.35 + 0.15 * i
    pad_l += (1 - pan) * s1 * (0.16 / len(freqs))
    pad_r += pan * s2 * (0.16 / len(freqs))

pulse = 0.78 + 0.22 * np.sin(2 * np.pi * 1.4 * t)
pad_l *= pulse
pad_r *= pulse

rng = np.random.default_rng(7)
beat_interval = int(sr * (60.0 / 84.0 / 2.0))
for idx in range(0, len(t) - 2000, beat_interval):
    hat_len = int(sr * 0.025)
    ht = np.linspace(0, 0.025, hat_len, endpoint=False)
    noise = rng.normal(0, 1, hat_len) * np.exp(-ht * 140) * 0.015
    pad_l[idx : idx + hat_len] += noise
    pad_r[idx : idx + hat_len] += noise * 0.9

fade_in = int(sr * 1.5)
fade_out = int(sr * 2.5)
env_pad = np.ones_like(t)
env_pad[:fade_in] = np.linspace(0, 1, fade_in)
env_pad[-fade_out:] = np.linspace(1, 0, fade_out)
pad_l *= env_pad
pad_r *= env_pad

pad_stereo = np.stack([np.clip(pad_l, -0.98, 0.98), np.clip(pad_r, -0.98, 0.98)], axis=-1)
pad_pcm = (pad_stereo * 32767.0).astype(np.int16)
pad_path = os.path.join(SFX_DIR, "pad-bed.wav")
with wave.open(pad_path, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    wf.writeframes(pad_pcm.tobytes())

print("Updated 86s pad-bed.wav:", pad_path)
