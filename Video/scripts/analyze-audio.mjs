// analyze-audio.mjs — Verificación automática del audio renderizado.
// Mide: picos, saturación, RMS por segmentos, silencios inesperados y
// presencia de voz en las franjas programadas.
import fs from "node:fs";

const file = process.argv[2];
const buf = fs.readFileSync(file);

// Recorrer chunks RIFF para localizar fmt y data (ffmpeg añade LIST/uext).
let pos = 12;
let fmt = null;
let dataStart = 0;
let dataLen = 0;
while (pos + 8 <= buf.length) {
  const id = buf.toString("ascii", pos, pos + 4);
  const size = buf.readUInt32LE(pos + 4);
  if (id === "fmt ") {
    fmt = {
      format: buf.readUInt16LE(pos + 8),
      ch: buf.readUInt16LE(pos + 10),
      sr: buf.readUInt32LE(pos + 12),
      bits: buf.readUInt16LE(pos + 22),
    };
  } else if (id === "data") {
    dataStart = pos + 8;
    dataLen = size;
    break;
  }
  pos += 8 + size + (size % 2);
}
if (!fmt || !dataStart) {
  console.error("WAV no reconocido");
  process.exit(1);
}
const ch = fmt.ch;
const sr = fmt.sr;
const bytesPerSample = fmt.bits / 8;
const frames = dataLen / (bytesPerSample * ch);

console.log(`sr=${sr} ch=${ch} bits=${fmt.bits} dur=${(frames / sr).toFixed(2)}s`);

let peak = 0;
let clipped = 0;
let sumSq = 0;

// RMS por segundo
const secCount = Math.ceil(frames / sr);
const rmsPerSec = new Array(secCount).fill(0);
const peakPerSec = new Array(secCount).fill(0);
const nPerSec = new Array(secCount).fill(0);

for (let i = 0; i < frames; i++) {
  const off = dataStart + i * ch * bytesPerSample;
  const l = buf.readInt16LE(off) / 32768;
  const r = ch > 1 ? buf.readInt16LE(off + 2) / 32768 : l;
  const m = Math.max(Math.abs(l), Math.abs(r));
  if (m > peak) peak = m;
  if (m >= 0.999) clipped++;
  sumSq += (l * l + r * r) / 2;
  const s = Math.floor(i / sr);
  rmsPerSec[s] += (l * l + r * r) / 2;
  nPerSec[s]++;
  if (m > peakPerSec[s]) peakPerSec[s] = m;
}

const rms = Math.sqrt(sumSq / frames);
const toDb = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);

console.log(`peak=${toDb(peak).toFixed(2)} dBFS  clipped_samples=${clipped}`);
console.log(`rms=${toDb(rms).toFixed(2)} dBFS`);

// Silencios inesperados (RMS < -60 dB en el medio del vídeo)
const silentSecs = [];
for (let s = 5; s < secCount - 2; s++) {
  const db = toDb(Math.sqrt(rmsPerSec[s] / Math.max(1, nPerSec[s])));
  if (db < -60) silentSecs.push(`${s}s(${db.toFixed(0)}dB)`);
}
console.log(
  `silent_seconds_mid=${silentSecs.length ? silentSecs.join(",") : "none"}`
);

// Presencia de voz por franja (segundos)
const voWindows = [
  [1, 4.2],
  [6.7, 10.8],
  [13.3, 21.3],
  [21.8, 26.4],
  [26.7, 29.0],
  [29.3, 34.6],
  [35.3, 41.2],
  [43.3, 45.2],
  [46.0, 48.6],
];
console.log("VO presence (RMS dB per window):");
for (const [a, b] of voWindows) {
  const s0 = Math.floor(a);
  const s1 = Math.min(secCount - 1, Math.floor(b));
  let acc = 0;
  let n = 0;
  for (let s = s0; s <= s1; s++) {
    acc += rmsPerSec[s];
    n += nPerSec[s];
  }
  const db = toDb(Math.sqrt(acc / Math.max(1, n)));
  console.log(`  ${a}-${b}s: ${db.toFixed(1)} dB`);
}

// Timeline por segundos para inspección manual
console.log("per-second RMS dB:");
console.log(
  rmsPerSec
    .map((v, i) => `${i}:${toDb(Math.sqrt(v / Math.max(1, nPerSec[i]))).toFixed(0)}`)
    .join(" ")
);
