// make-vo.mjs — Genera la narración con edge-tts (voz femenina es-MX-DaliaNeural).
// Frases separadas para colocarlas con precisión en la línea de tiempo.
// Requiere: pip install edge-tts
// Salida: public/audio/vo/*.mp3 (luego procesadas a WAV con ffmpeg)

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "audio", "vo");

const VOICE = "es-MX-DaliaNeural";
// Rate ligeramente negativo = más pausado y natural; pitch neutro-cálido.
const RATE = "-4%";
const PITCH = "-2Hz";

// Frases alineadas con las escenas (ver src/audio/script.ts).
const LINES = [
  { id: "01-idea", text: "Crear contenido es solo el comienzo." },
  { id: "02-strategy", text: "Detrás de cada gran idea, hay una estrategia." },
  {
    id: "03-hookhub",
    text: "Por eso nace HookHub: un espacio para analizar, planificar y desarrollar tus ideas con herramientas inteligentes.",
  },
  { id: "04-journey", text: "Desde tus primeros conceptos hasta una estrategia más organizada," },
  { id: "04-step", text: "cada paso importa." },
  { id: "04-tools", text: "Estrategia, integraciones y estudio de video, en un solo lugar." },
  { id: "05-vision", text: "Tu contenido. Tu estrategia. Tu crecimiento." },
  { id: "06-brand", text: "HookHub." },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const line of LINES) {
  const out = path.join(OUT_DIR, `${line.id}.mp3`);
  console.log(`[${line.id}] "${line.text}"`);
  execFileSync(
    "python",
    [
      "-m",
      "edge_tts",
      "--voice",
      VOICE,
      `--rate=${RATE}`,
      `--pitch=${PITCH}`,
      "--text",
      line.text,
      "--write-media",
      out,
    ],
    { stdio: ["ignore", "pipe", "inherit"] }
  );
  const st = fs.statSync(out);
  console.log(`  → ${(st.size / 1024).toFixed(0)} KB`);
}

console.log("Narración generada en", OUT_DIR);
