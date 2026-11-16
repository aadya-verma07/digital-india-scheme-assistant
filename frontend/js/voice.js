// Voice input (Web Speech API, en-IN / hi-IN) and read-aloud. Works in Chrome and Edge; needs HTTPS outside localhost.
// FILE: js/voice.js - speaking to the website and hearing answers, using the browser's built-in Web Speech API.
// No server code or AI model of ours is involved: the browser (Chrome/Edge/Safari) does the speech recognition.
//   listen() - speech -> text (microphone button)
//   speak()  - text -> speech (read-aloud button / auto read)

import { L, hi } from "./i18n.js";
import { toast } from "./ui.js";

// The browser's speech-recognition class (Chrome uses the 'webkit' prefixed name). undefined = not supported.
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// The recognition currently running (only one at a time).
let active = null;

// listen(button, onText, onDone): start listening.
// - language follows the site: hi-IN (Hindi) or en-IN (Indian English)
// - interimResults: words appear in the text box WHILE the user speaks (onText)
// - when the user stops, the final text is passed to onDone (which sends the search / chat message)
// - tapping the mic again stops listening.
export function listen(button, onText, onDone) {
  if (!Recognition) { toast(L("no_voice")); return; }
  if (active) { active.stop(); return; }
  const rec = new Recognition();
  rec.lang = hi() ? "hi-IN" : "en-IN";
  rec.interimResults = true;
  let finalText = "";
  // Called repeatedly as speech is recognised: final parts are kept, interim parts are shown but may still change.
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    onText((finalText + interim).trim());
  };
  // Reset the mic button when listening ends or fails.
  const stop = () => { button.classList.remove("listening"); button.setAttribute("aria-pressed", "false"); active = null; };
  rec.onend = () => { stop(); if (finalText.trim()) onDone(finalText.trim()); };
  rec.onerror = stop;
  active = rec;
  button.classList.add("listening"); button.setAttribute("aria-pressed", "true");
  toast(L("listening"));
  rec.start();
}

// speak(text, lang): read text aloud.
// Cleans the text first (removes links; reads ✓ as "yes"/"हाँ" and ✗ as "no"/"नहीं"), picks an Indian English or
// Hindi voice if the device has one, and speaks slightly slower than normal (rate 0.95) for easier listening.
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
// Ask the browser to load its voice list early (it loads asynchronously).
if ("speechSynthesis" in window) speechSynthesis.getVoices();
