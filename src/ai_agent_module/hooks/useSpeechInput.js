import { useRef, useState, useCallback, useEffect } from 'react';

export default function useSpeechInput({ lang = 'bn-BD', onResult } = {}) {
  const SR = typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const recRef = useRef(null);
  const cbRef = useRef(onResult);
  cbRef.current = onResult;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');

  const start = useCallback(() => {
    if (!SR || recRef.current) return;
    setError('');
    let delivered = false;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      let text = '';
      let isFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      setInterim(text);
      if (isFinal && !delivered && text.trim()) {
        delivered = true;
        cbRef.current?.(text.trim());
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'aborted') return;
      setError(
        e.error === 'not-allowed' ? 'মাইক্রোফোনের অনুমতি দিন।'
          : e.error === 'no-speech' ? 'কিছু শুনতে পাইনি, আবার বলুন।'
            : 'কথা বুঝতে পারিনি, আবার বলুন।'
      );
    };
    rec.onend = () => { recRef.current = null; setListening(false); setInterim(''); };
    recRef.current = rec;
    try { rec.start(); } catch (e) { recRef.current = null; }
  }, [SR, lang]);

  const stop = useCallback(() => recRef.current?.stop(), []);
  useEffect(() => () => recRef.current?.abort(), []);

  return { supported: !!SR, listening, interim, error, start, stop };
}