// Voice input (Web Speech API, en-IN / hi-IN) and read-aloud. Works in Chrome and Edge; needs HTTPS outside localhost.
import { L, hi } from "./i18n.js";
import { toast } from "./ui.js";

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let active = null;

export function listen(button, onText, onDone) {
  if (!Recognition) { toast(L("no_voice")); return; }
  if (active) { active.stop(); return; }
  const rec = new Recognition();
  rec.lang = hi() ? "hi-IN" : "en-IN";
  rec.interimResults = true;
  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    onText((finalText + interim).trim());
  };
  const stop = () => { button.classList.remove("listening"); button.setAttribute("aria-pressed", "false"); active = null; };
  rec.onend = () => { stop(); if (finalText.trim()) onDone(finalText.trim()); };
  rec.onerror = stop;
  active = rec;
  button.classList.add("listening"); button.setAttribute("aria-pressed", "true");
  toast(L("listening"));
  rec.start();
}

export function speak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const clean = text.replace(/https?:\/\/\S+/g, "").replace(/[•✓✗]/g, (m) => (m === "✓" ? (lang === "hi" ? "हाँ, " : "yes, ") : m === "✗" ? (lang === "hi" ? "नहीं, " : "no, ") : ""));
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = lang === "hi" ? "hi-IN" : "en-IN";
  const voices = speechSynthesis.getVoices();
  const v = voices.find((x) => x.lang === u.lang) || voices.find((x) => x.lang.startsWith(lang));
  if (v) u.voice = v;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}
if ("speechSynthesis" in window) speechSynthesis.getVoices();
