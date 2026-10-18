// make-audio.mjs — Genera música cinematográfica + kit de SFX en WAV.
// 100% determinista y offline. Sin dependencias externas ni problemas de licencia.
// Salida: public/audio/music.wav, public/audio/sfx/*.wav
// 44100 Hz, estéreo, 16-bit PCM.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SFX_DIR = path.join(ROOT, "public", "audio", "sfx");

const SR = 44100;
const DUR_MUSIC = 50.0; // segundos — igual que el vídeo
const BPM = 90;
const BEAT = 60 / BPM; // 0.6667 s
const BAR = BEAT * 4; // 2.6667 s

// ───────────────────────── PRNG determinista ─────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────────────────── Buses ─────────────────────────
function createBuffer(seconds) {
  const n = Math.floor(SR * seconds);
  return { L: new Float64Array(n), R: new Float64Array(n), n };
}

// Suma una señal mono en [startSec, gainL, gainR]
function addMono(buf, startSec, samples, gainL = 1, gainR = 1) {
  const start = Math.floor(startSec * SR);
  for (let i = 0; i < samples.length; i++) {
    const j = start + i;
    if (j < 0 || j >= buf.n) continue;
    buf.L[j] += samples[i] * gainL;
    buf.R[j] += samples[i] * gainR;
  }
}

// Pan estéreo [-1..1]
function panGains(pan) {
  const p = Math.max(-1, Math.min(1, pan));
  const ang = ((p + 1) * Math.PI) / 4;
  return [Math.cos(ang), Math.sin(ang)];
}

// ───────────────────────── Osciladores / envolventes ─────────────────────────
function adsr(len, a, d, s, r) {
  const env = new Float64Array(len);
  const A = Math.floor(a * SR);
  const D = Math.floor(d * SR);
  const R = Math.floor(r * SR);
  const S = Math.max(0, len - A - D - R);
  let k = 0;
  for (let i = 0; i < A && k < len; i++, k++) env[k] = i / A;
  for (let i = 0; i < D && k < len; i++, k++) env[k] = 1 - (1 - s) * (i / D);
  for (let i = 0; i < S && k < len; i++, k++) env[k] = s;
  for (let i = 0; i < R && k < len; i++, k++) env[k] = s * (1 - i / R);
  return env;
}

function expDecay(len, tau) {
  const env = new Float64Array(len);
  for (let i = 0; i < len; i++) env[i] = Math.exp(-i / (tau * SR));
  return env;
}

function noteFreq(semitonesFromA4) {
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

// Mapa de notas desde A4
const N = {
  A2: -24, C3: -21, D3: -19, E3: -17, F3: -16, G3: -14, A3: -12,
  B3: -10, C4: -9, D4: -7, E4: -5, F4: -4, G4: -2, A4: 0,
  B4: 2, C5: 3, D5: 5, E5: 7, G5: 10, A5: 12, C6: 15, E6: 19,
  A1: -36, F2: -28, G2: -26, C2: -33, E2: -29,
};

function oscSine(freq, len, phase = 0) {
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) out[i] = Math.sin(2 * Math.PI * freq * (i / SR) + phase);
  return out;
}

function oscSaw(freq, len, detuneCents = 0) {
  const f = freq * Math.pow(2, detuneCents / 1200);
  const out = new Float64Array(len);
  const inc = f / SR;
  let ph = 0;
  for (let i = 0; i < len; i++) {
    ph += inc;
    if (ph >= 1) ph -= 1;
    out[i] = 2 * ph - 1; // saw
  }
  return out;
}

function noise(len, rng) {
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) out[i] = rng() * 2 - 1;
  return out;
}

// Filtro paso bajo de 2 polos (butterworth-ish por cascada de one-pole)
function lowpass(x, cutoffHz, q = 0.707) {
  const out = new Float64Array(x.length);
  const g = Math.tan((Math.PI * cutoffHz) / SR);
  const k = 1 / q;
  const a1 = 1 / (1 + g * (g + k));
  const a2 = g * a1;
  const b3 = g * g * a1;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const w0 = x[i];
    const w3 = w0 - k * y1 - y2;
    const y0 = a1 * w0 + a2 * w3 - a2 * y1 - b3 * y2;
    // corrección estándar TPT
    const v3 = w0 - y0;
    const v1 = a1 * v3 + a2 * x1; // aproximación estable
    out[i] = y0;
    x1 = a1 * v3 + a2 * x2;
    x2 = v3;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

function lowpassSimple(x, cutoffHz) {
  const out = new Float64Array(x.length);
  const dt = 1 / SR;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const a = dt / (rc + dt);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    y += a * (x[i] - y);
    out[i] = y;
  }
  return out;
}

function highpassSimple(x, cutoffHz) {
  const lp = lowpassSimple(x, cutoffHz);
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] - lp[i];
  return out;
}

function bandpass(x, centerHz, q = 2) {
  return highpassSimple(lowpassSimple(x, centerHz * (1 + 1 / q)), centerHz * (1 - 1 / (2 * q)));
}

function mix(...arrs) {
  const len = Math.max(...arrs.map((a) => a.length));
  const out = new Float64Array(len);
  for (const a of arrs) for (let i = 0; i < a.length; i++) out[i] += a[i];
  return out;
}

function scale(x, g) {
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] * g;
  return out;
}

function softClip(x) {
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = Math.tanh(x[i] * 1.2) / 1.2;
  return out;
}

// Retardo simple (echo)
function delay(x, timeSec, feedback = 0.35, mixAmt = 0.35) {
  const d = Math.floor(timeSec * SR);
  const out = new Float64Array(x.length);
  const buf = new Float64Array(d);
  let bi = 0;
  for (let i = 0; i < x.length; i++) {
    const delayed = buf[bi];
    const cur = x[i] + delayed * feedback;
    buf[bi] = cur;
    bi = (bi + 1) % d;
    out[i] = x[i] * (1 - mixAmt) + delayed * mixAmt;
  }
  return out;
}

// ───────────────────────── WAV writer ─────────────────────────
function writeWav(filePath, buf) {
  const n = buf.n;
  const data = Buffer.alloc(n * 4); // estéreo 16-bit
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, buf.L[i]));
    const r = Math.max(-1, Math.min(1, buf.R[i]));
    data.writeInt16LE(Math.round(l * 32767), i * 4);
    data.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(2, 22); // stereo
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(filePath, Buffer.concat([header, data]));
  return data.length;
}

// Normalización de picos a dBFS objetivo
function normalizeToDbFS(buf, targetDb) {
  let peak = 0;
  for (let i = 0; i < buf.n; i++) {
    peak = Math.max(peak, Math.abs(buf.L[i]), Math.abs(buf.R[i]));
  }
  if (peak < 1e-9) return;
  const target = Math.pow(10, targetDb / 20);
  const g = target / peak;
  for (let i = 0; i < buf.n; i++) {
    buf.L[i] *= g;
    buf.R[i] *= g;
  }
}

// ═════════════════════════ MÚSICA ═════════════════════════
// Cinematográfica electrónica en La menor. Progresión i–VI–III–VII (Am–F–C–G).
// Arquitectura por secciones con crecimiento gradual y resolución limpia.
function buildMusic() {
  const buf = createBuffer(DUR_MUSIC + 2); // +2s de cola de reverb
  const rng = mulberry32(1337);

  // Progresión de 4 compases (Am, F, C, G) — cada compás = BAR segundos
  const progression = [
    { bass: N.A1, chord: [N.A3, N.C4, N.E4, N.A4] },
    { bass: N.F2, chord: [N.F3, N.A3, N.C4, N.F4] },
    { bass: N.C2, chord: [N.C4, N.E4, N.G4, N.C5] },
    { bass: N.G2, chord: [N.G3, N.B3, N.D4, N.G4] },
  ];

  const T = {
    introEnd: 6.0,
    challengeEnd: 13.0,
    reveal: 13.0,
    featuresStart: 20.0,
    visionStart: 34.0,
    outroStart: 42.0,
    musicEnd: 48.0,
  };

  // ── PAD (cama armónica, toda la pieza con evolución de filtro) ──
  for (let bar = 0; bar * BAR < DUR_MUSIC; bar++) {
    const t = bar * BAR;
    const ch = progression[bar % 4];
    const padLen = Math.floor(BAR * 1.6 * SR);
    const notes = ch.chord.map((semi) => {
      const raw = mix(
        oscSaw(noteFreq(semi), padLen, -6),
        oscSaw(noteFreq(semi), padLen, 7),
        scale(oscSine(noteFreq(semi), padLen), 0.5)
      );
      return raw;
    });
    let pad = notes[0];
    for (let i = 1; i < notes.length; i++) pad = mix(pad, notes[i]);
    pad = scale(pad, 1 / notes.length);

    // Filtro que se abre con el tiempo (intro oscuro → clímax brillante)
    const openness = Math.min(1, Math.max(0, (t - 2) / 34));
    const cutoff = 320 + openness * 2400;
    pad = lowpassSimple(pad, cutoff);

    const env = adsr(padLen, BAR * 0.35, BAR * 0.2, 0.75, BAR * 0.55);
    for (let i = 0; i < padLen; i++) pad[i] *= env[i] * 0.16;

    // Haas ligero para amplitud estéreo
    const off = Math.floor(0.012 * SR);
    addMono(buf, t, pad, 0.55, 0.42);
    addMono(buf, t + 0.012, pad, 0.42, 0.55);
    void off;
  }

  // ── SUB BASS (entra en el reveal, a partir de 13 s) ──
  for (let bar = 0; bar * BAR < DUR_MUSIC; bar++) {
    const t = bar * BAR;
    if (t < T.reveal - BAR * 0.5) continue;
    const ch = progression[bar % 4];
    const len = Math.floor(BAR * SR);
    const sub = oscSine(noteFreq(ch.bass), len);
    const env = adsr(len, 0.06, 0.15, 0.85, 0.4);
    const s = scale(sub, 0.22);
    for (let i = 0; i < len; i++) s[i] *= env[i];
    // Corte de sub en el outro
    const outroFade = t > T.outroStart ? Math.max(0, 1 - (t - T.outroStart) / 5) : 1;
    addMono(buf, t, scale(s, outroFade), 0.5, 0.5);
  }

  // ── ARP / PULSO MUSICAL (desde features, 20 s) — 8 pentagramas ──
  const arpPattern = [0, 2, 3, 2, 1, 3, 2, 1]; // índices dentro del acorde
  for (let bar = 0; bar * BAR < DUR_MUSIC; bar++) {
    const t0 = bar * BAR;
    if (t0 < T.featuresStart - BAR * 0.999) continue;
    if (t0 > T.outroStart + BAR) break;
    const ch = progression[bar % 4];
    const eighth = BEAT / 2;
    for (let e = 0; e < 8; e++) {
      const t = t0 + e * eighth;
      if (t < T.featuresStart - 0.01 || t > T.outroStart + 0.5) continue;
      const semi = ch.chord[arpPattern[e]] + 12;
      const len = Math.floor(0.5 * SR);
      let pluck = oscSine(noteFreq(semi), len);
      pluck = mix(pluck, scale(oscSaw(noteFreq(semi), len, 3), 0.3));
      pluck = lowpassSimple(pluck, 2800);
      const env = expDecay(len, 0.09);
      for (let i = 0; i < len; i++) pluck[i] *= env[i] * 0.05;
      const echoed = delay(pluck, eighth * 1.5, 0.3, 0.28);
      const pan = e % 2 === 0 ? -0.25 : 0.25;
      const [gl, gr] = panGains(pan);
      // Intensidad creciente hasta el clímax
      const intensity = t < T.visionStart ? 0.75 : t < T.outroStart ? 1.0 : 0.55;
      addMono(buf, t, scale(echoed, intensity), gl, gr);
    }
  }

  // ── PULSO / KICK SUAVE (desde features, en cada beat) ──
  for (let t = T.featuresStart; t < T.outroStart + 0.2; t += BEAT) {
    const len = Math.floor(0.6 * SR);
    const kickOsc = new Float64Array(len);
    const f0 = 120, f1 = 42;
    for (let i = 0; i < len; i++) {
      const k = i / len;
      const f = f1 + (f0 - f1) * Math.exp(-k * 14);
      kickOsc[i] = Math.sin((2 * Math.PI * f * i) / SR);
    }
    const env = expDecay(len, 0.11);
    const s = scale(kickOsc, 0.28);
    for (let i = 0; i < len; i++) s[i] *= env[i];
    const isStrong = Math.abs((t / BEAT) % 4) < 0.01;
    const gain = t < T.visionStart ? 0.7 : isStrong ? 1.0 : 0.8;
    addMono(buf, t, scale(s, gain * (t > T.outroStart - 0.1 ? 0.4 : 1)), 0.5, 0.5);
  }

  // ── HI-HAT / TEXTURA DE RUIDO (20 → 42 s) ──
  for (let t = T.featuresStart; t < T.outroStart; t += BEAT / 2) {
    const len = Math.floor(0.14 * SR);
    let nz = noise(len, rng);
    nz = highpassSimple(nz, 6500);
    const env = expDecay(len, 0.02);
    for (let i = 0; i < len; i++) nz[i] *= env[i] * 0.028;
    const offbeat = Math.abs((t / (BEAT / 2)) % 2 - 1) < 0.01;
    addMono(buf, t, scale(nz, offbeat ? 1.0 : 0.55), 0.45, 0.55);
  }

  // ── CLÍMAX (34–42 s): capa de brillantez + cuerdas sintéticas ──
  for (let bar = 0; bar * BAR < DUR_MUSIC; bar++) {
    const t0 = bar * BAR;
    if (t0 < T.visionStart - 0.01 || t0 >= T.outroStart) continue;
    const ch = progression[bar % 4];
    const len = Math.floor(BAR * 0.9 * SR);
    const top = ch.chord[3] + 12;
    let lead = mix(
      oscSaw(noteFreq(top), len, -4),
      oscSaw(noteFreq(top), len, 5),
      scale(oscSine(noteFreq(top + 12), len), 0.25)
    );
    lead = lowpassSimple(lead, 3200);
    const env = adsr(len, 0.4, 0.3, 0.7, BAR * 0.35);
    for (let i = 0; i < len; i++) lead[i] *= env[i] * 0.035;
    const echoed = delay(lead, BEAT * 0.75, 0.32, 0.3);
    addMono(buf, t0, echoed, 0.5, 0.5);
  }

  // ── SHIMMER DE APERTURA (0–6 s): brillo etéreo de la idea ──
  for (let i = 0; i < 7; i++) {
    const t = 0.4 + i * 0.75 + (i % 3) * 0.11;
    const semi = [N.E5, N.A5, N.C6, N.E6, N.A5, N.C6, N.E5][i];
    const len = Math.floor(1.4 * SR);
    let tone = oscSine(noteFreq(semi), len);
    tone = mix(tone, scale(oscSine(noteFreq(semi) * 2.001, len), 0.3));
    const env = expDecay(len, 0.35);
    for (let j = 0; j < len; j++) tone[j] *= env[j] * 0.012;
    const [gl, gr] = panGains((i % 2 === 0 ? -1 : 1) * 0.35);
    addMono(buf, t, tone, gl, gr);
  }

  // ── RISER AL REVEAL (11.0 → 13.0 s) ──
  {
    const riserLen = Math.floor(2.0 * SR);
    let nz = noise(riserLen, rng);
    // Barrido de banda ascendente simulado con mezcla progresiva de cortes
    const out = new Float64Array(riserLen);
    const lpLow = lowpassSimple(nz, 900);
    const lpHigh = lowpassSimple(nz, 7000);
    for (let i = 0; i < riserLen; i++) {
      const k = i / riserLen;
      out[i] = lpLow[i] * (1 - k) + lpHigh[i] * k;
    }
    // Tono ascendente
    const tone = new Float64Array(riserLen);
    for (let i = 0; i < riserLen; i++) {
      const k = i / riserLen;
      const f = 180 * Math.pow(2, k * 2.2);
      tone[i] = Math.sin((2 * Math.PI * f * i) / SR) * 0.25;
    }
    let sig = mix(out, tone);
    const env = new Float64Array(riserLen);
    for (let i = 0; i < riserLen; i++) {
      const k = i / riserLen;
      env[i] = k * k; // crecimiento cuadrático
    }
    for (let i = 0; i < riserLen; i++) sig[i] *= env[i] * 0.16;
    addMono(buf, T.reveal - 2.0, sig, 0.5, 0.5);
  }

  // ── IMPACTO DEL REVEAL (13.0 s) ──
  {
    const t = T.reveal;
    const len = Math.floor(2.8 * SR);
    // Sub drop
    const drop = new Float64Array(len);
    for (let i = 0; i < len; i++) {
      const k = i / len;
      const f = 55 * Math.pow(2, -k * 1.5);
      drop[i] = Math.sin((2 * Math.PI * f * i) / SR);
    }
    const dropEnv = expDecay(len, 0.7);
    for (let i = 0; i < len; i++) drop[i] *= dropEnv[i] * 0.5;
    // Cuerpo de impacto (ruido filtrado grave)
    let body = noise(len, rng);
    body = lowpassSimple(body, 420);
    const bodyEnv = expDecay(len, 0.22);
    for (let i = 0; i < len; i++) body[i] *= bodyEnv[i] * 0.4;
    // Destello brillante
    const spark = new Float64Array(Math.floor(1.2 * SR));
    for (let i = 0; i < spark.length; i++) {
      spark[i] =
        Math.sin((2 * Math.PI * noteFreq(N.A5) * i) / SR) * 0.18 +
        Math.sin((2 * Math.PI * noteFreq(N.E6) * i) / SR) * 0.1;
    }
    const sparkEnv = expDecay(spark.length, 0.3);
    for (let i = 0; i < spark.length; i++) spark[i] *= sparkEnv[i];
    let sig = mix(drop, body);
    addMono(buf, t, sig, 0.5, 0.5);
    addMono(buf, t + 0.02, spark, 0.5, 0.5);
  }

  // ── RESOLUCIÓN FINAL (42 s → fin): acorde de cierre en La mayor (picardy) ──
  {
    const t = T.outroStart;
    const len = Math.floor(6.0 * SR);
    const chordSemis = [N.A2, N.E3, N.A3, N.C4 + 1, N.E4]; // A mayor
    let chord = new Float64Array(len);
    for (const semi of chordSemis) {
      let v = mix(
        oscSaw(noteFreq(semi), len, -5),
        oscSaw(noteFreq(semi), len, 6),
        scale(oscSine(noteFreq(semi), len), 0.6)
      );
      v = lowpassSimple(v, 1900);
      chord = mix(chord, v);
    }
    chord = scale(chord, 1 / chordSemis.length);
    const env = adsr(len, 0.5, 1.2, 0.6, 4.0);
    for (let i = 0; i < len; i++) chord[i] *= env[i] * 0.14;
    const off = 0.015;
    addMono(buf, t, chord, 0.55, 0.42);
    addMono(buf, t + off, chord, 0.42, 0.55);
    // Nota alta de firma
    const len2 = Math.floor(4.5 * SR);
    let top = oscSine(noteFreq(N.A5), len2);
    top = mix(top, scale(oscSine(noteFreq(N.A5) * 2.002, len2), 0.25));
    const env2 = expDecay(len2, 1.4);
    for (let i = 0; i < len2; i++) top[i] *= env2[i] * 0.05;
    addMono(buf, t + 0.35, top, 0.5, 0.5);
  }

  // Fade de entrada y salida
  const total = Math.floor(DUR_MUSIC * SR);
  for (let i = 0; i < Math.floor(1.2 * SR); i++) {
    const g = i / (1.2 * SR);
    buf.L[i] *= g;
    buf.R[i] *= g;
  }
  const fadeStart = Math.floor((DUR_MUSIC - 3.0) * SR);
  for (let i = fadeStart; i < total; i++) {
    const g = Math.max(0, 1 - (i - fadeStart) / (total - fadeStart));
    buf.L[i] *= g;
    buf.R[i] *= g;
  }

  // Master: soft clip + normalización
  for (let i = 0; i < buf.n; i++) {
    buf.L[i] = Math.tanh(buf.L[i] * 1.15);
    buf.R[i] = Math.tanh(buf.R[i] * 1.15);
  }
  normalizeToDbFS(buf, -3.0);

  // Recortar exactamente a DUR_MUSIC
  const final = { L: buf.L.subarray(0, total), R: buf.R.subarray(0, total), n: total };
  return final;
}

// ═════════════════════════ SFX ═════════════════════════
function whoosh(durSec, { down = false, bright = 1 } = {}) {
  const len = Math.floor(durSec * SR);
  const rng = mulberry32(42);
  let nz = noise(len, rng);
  // Barrido de filtro
  const out = new Float64Array(len);
  const lpA = lowpassSimple(nz, 400 * bright);
  const lpB = lowpassSimple(nz, 5200 * bright);
  const hpA = highpassSimple(nz, 300 * bright);
  for (let i = 0; i < len; i++) {
    const k = down ? 1 - i / len : i / len;
    const shaped = k * k * (3 - 2 * k); // smoothstep
    out[i] = lpA[i] * (1 - shaped) + lpB[i] * shaped;
    out[i] = out[i] * 0.7 + hpA[i] * shaped * 0.3;
  }
  const env = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const k = i / len;
    // envolvente de campana asimétrica
    env[i] = Math.sin(Math.PI * Math.pow(k, down ? 0.7 : 1.3));
  }
  for (let i = 0; i < len; i++) out[i] *= env[i] * 0.5;
  return { L: out, R: out, n: len };
}

function impact(durSec = 2.0) {
  const len = Math.floor(durSec * SR);
  const rng = mulberry32(77);
  const drop = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const k = i / len;
    const f = 70 * Math.pow(2, -k * 1.2);
    drop[i] = Math.sin((2 * Math.PI * f * i) / SR);
  }
  const dropEnv = expDecay(len, 0.5);
  for (let i = 0; i < len; i++) drop[i] *= dropEnv[i] * 0.7;
  let body = noise(len, rng);
  body = lowpassSimple(body, 380);
  const bodyEnv = expDecay(len, 0.18);
  for (let i = 0; i < len; i++) body[i] *= bodyEnv[i] * 0.5;
  const out = mix(drop, body);
  return { L: out, R: out, n: len };
}

function riser(durSec = 2.0) {
  const len = Math.floor(durSec * SR);
  const rng = mulberry32(99);
  const nz = noise(len, rng);
  const lpLow = lowpassSimple(nz, 700);
  const lpHigh = lowpassSimple(nz, 6500);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const k = i / len;
    out[i] = lpLow[i] * (1 - k) + lpHigh[i] * k;
  }
  const tone = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const k = i / len;
    const f = 160 * Math.pow(2, k * 2.4);
    tone[i] = Math.sin((2 * Math.PI * f * i) / SR) * 0.3;
  }
  let sig = mix(out, tone);
  for (let i = 0; i < len; i++) {
    const k = i / len;
    sig[i] *= k * k * 0.5;
  }
  return { L: sig, R: sig, n: len };
}

function tick(freq = 2400, durSec = 0.07, gain = 0.5) {
  const len = Math.floor(durSec * SR);
  let s = oscSine(freq, len);
  s = mix(s, scale(oscSine(freq * 1.5, len), 0.4));
  const env = expDecay(len, 0.015);
  for (let i = 0; i < len; i++) s[i] *= env[i] * gain;
  return { L: s, R: s, n: len };
}

function uiBlip(freq = 880, durSec = 0.16) {
  const len = Math.floor(durSec * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const k = i / len;
    const f = freq * (1 + k * 0.5);
    out[i] = Math.sin((2 * Math.PI * f * i) / SR);
  }
  const env = adsr(len, 0.008, 0.04, 0.35, 0.1);
  for (let i = 0; i < len; i++) out[i] *= env[i] * 0.28;
  return { L: out, R: out, n: len };
}

function shimmer(durSec = 1.4) {
  const len = Math.floor(durSec * SR);
  const semis = [N.E5, N.A5, N.C6, N.E6];
  let out = new Float64Array(len);
  semis.forEach((semi, idx) => {
    const start = Math.floor(idx * 0.07 * SR);
    const t = oscSine(noteFreq(semi), len - start);
    const env = expDecay(len - start, 0.3);
    for (let i = 0; i < len - start; i++) out[start + i] += t[i] * env[i] * 0.12;
  });
  return { L: out, R: out, n: len };
}

function subDrop(durSec = 1.6) {
  const len = Math.floor(durSec * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const k = i / len;
    const f = 90 * Math.pow(2, -k * 2.0);
    out[i] = Math.sin((2 * Math.PI * f * i) / SR);
  }
  const env = expDecay(len, 0.5);
  for (let i = 0; i < len; i++) out[i] *= env[i] * 0.55;
  return { L: out, R: out, n: len };
}

function reverseSwoosh(durSec = 1.2) {
  const w = whoosh(durSec, { down: false, bright: 0.8 });
  const out = new Float64Array(w.n);
  for (let i = 0; i < w.n; i++) out[i] = w.L[w.n - 1 - i]; // invertir
  return { L: out, R: out, n: w.n };
}

function softRiserToHit(durSec = 1.5) {
  // riser corto + click final para cortes de escena
  const r = riser(durSec);
  const click = tick(3200, 0.05, 0.4);
  const len = r.n + click.n;
  const out = new Float64Array(len);
  for (let i = 0; i < r.n; i++) out[i] += r.L[i];
  for (let i = 0; i < click.n; i++) out[r.n - click.n + i] += click.L[i] * 0.5;
  return { L: out, R: out, n: len };
}

// ═════════════════════════ Main ═════════════════════════
function main() {
  fs.mkdirSync(SFX_DIR, { recursive: true });
  fs.mkdirSync(path.join(ROOT, "public", "audio"), { recursive: true });

  console.log("Generando música…");
  const music = buildMusic();
  const musicPath = path.join(ROOT, "public", "audio", "music.wav");
  const bytes = writeWav(musicPath, music);
  console.log(`  music.wav — ${(bytes / 1e6).toFixed(1)} MB, ${DUR_MUSIC}s`);

  console.log("Generando SFX…");
  const kit = {
    "whoosh-soft.wav": whoosh(0.9, { bright: 0.9 }),
    "whoosh-strong.wav": whoosh(1.3, { bright: 1.2 }),
    "whoosh-down.wav": whoosh(0.8, { down: true, bright: 0.8 }),
    "impact.wav": impact(2.4),
    "riser.wav": riser(2.0),
    "riser-short.wav": softRiserToHit(1.1),
    "tick.wav": tick(2600, 0.06, 0.45),
    "tick-low.wav": tick(1400, 0.08, 0.4),
    "blip.wav": uiBlip(740, 0.18),
    "blip-high.wav": uiBlip(1320, 0.14),
    "shimmer.wav": shimmer(1.6),
    "subdrop.wav": subDrop(1.8),
    "swoosh-reverse.wav": reverseSwoosh(1.1),
  };
  for (const [name, buf] of Object.entries(kit)) {
    normalizeToDbFS(buf, -3.0);
    const b = writeWav(path.join(SFX_DIR, name), buf);
    console.log(`  ${name} — ${(b / 1000).toFixed(0)} KB`);
  }
  console.log("Listo.");
}

main();
