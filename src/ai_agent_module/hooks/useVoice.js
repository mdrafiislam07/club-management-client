import { useState, useEffect, useRef, useCallback } from 'react';

const KEY = 'aiag_voice_v2';
const ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const browserTts = typeof window !== 'undefined' && 'speechSynthesis' in window;

const toSpeakable = (t) =>
  t.replace(/https?:\/\/\S+/g, ' ').replace(/[*_#`>~|]/g, ' ').replace(/\s+/g, ' ').trim();
const isBangla = (t) => /[\u0980-\u09FF]/.test(t);
const norm = (l) => (l || '').toLowerCase().replace('_', '-');

function pickVoice(voices, lang) {
  const list = voices.filter((v) => norm(v.lang).startsWith(lang));
  if (!list.length) return null;
  const score = (v) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural|neural|online/.test(n)) s += 50;
    if (n.includes('google')) s += 30;
    if (!v.localService) s += 5;
    return s;
  };
  return [...list].sort((a, b) => score(b) - score(a))[0];
}

export default function useVoice() {
  // টেক্সট চ্যাটের রিপ্লাই আর নিজে নিজে পড়বে না (ডিফল্ট off)
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; }
  });
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState('');
  const voices = useRef([]);
  const audioRef = useRef(null);
  const abortRef = useRef(null);
  const doneRef = useRef(null);

  const finish = useCallback((ok) => {
    setSpeaking(false);
    const d = doneRef.current;
    doneRef.current = null;
    if (d) d(ok);
  }, []);

  useEffect(() => {
    if (!browserTts) return undefined;
    const load = () => { voices.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (browserTts) window.speechSynthesis.cancel();
    finish(false);
  }, [finish]);

  useEffect(() => {
    window.addEventListener('pagehide', stop);
    return () => { window.removeEventListener('pagehide', stop); stop(); };
  }, [stop]);

  // ফলব্যাক: ব্রাউজারের নিজস্ব ভয়েস
  const speakBrowser = useCallback((clean) => {
    if (!browserTts) return finish(false);
    if (!voices.current.length) voices.current = window.speechSynthesis.getVoices();
    const lang = isBangla(clean) ? 'bn' : 'en';
    const voice = pickVoice(voices.current, lang);
    if (lang === 'bn' && !voice) {
      setNotice('এই ডিভাইস/ব্রাউজারে বাংলা ভয়েস নেই।');
      return finish(false);
    }
    const chunks = clean.split(/(?<=[।.!?])\s+/).filter(Boolean);
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; }
      u.rate = lang === 'bn' ? 0.95 : 1;
      if (i === 0) u.onstart = () => setSpeaking(true);
      if (i === chunks.length - 1) u.onend = () => finish(true);
      u.onerror = () => finish(false);
      window.speechSynthesis.speak(u);
    });
    return undefined;
  }, [finish]);

  const speak = useCallback((text, { force = false } = {}) => new Promise((resolve) => {
    if (!force && !enabled) return resolve(false);
    const clean = toSpeakable(text || '');
    if (!clean) return resolve(false);
    stop();
    setNotice('');
    doneRef.current = resolve;

    (async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        setSpeaking(true);
        const res = await fetch(`${ROOT}/api/ai/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error('tts failed');
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); finish(true); };
        audio.onerror = () => { URL.revokeObjectURL(url); finish(false); };
        await audio.play();
      } catch (e) {
        if (e.name === 'AbortError') return;
        speakBrowser(clean);
      }
    })();
    return undefined;
  }), [enabled, stop, finish, speakBrowser]);

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem(KEY, next ? 'on' : 'off'); } catch (e) { /* ignore */ }
    if (!next) stop();
  }, [enabled, stop]);

  return { supported: true, enabled, speaking, notice, speak, stop, toggle };
}