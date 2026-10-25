import { useState, useCallback, useRef, useEffect } from 'react';
import { askAgent } from '../services/aiApi';

const KEY = 'aiag_chat_v1';
const MAX_KEEP = 40;

const GREETING = {
  id: 'greeting',
  role: 'model',
  greeting: true,
  text: 'আসসালামু আলাইকুম! আমি ক্লাবের AI সহকারী। টুর্নামেন্ট, স্কোর, কমিটি, নোটিশ — যেকোনো কিছু জিজ্ঞেস করুন, অথবা বলুন কোন পেজে যেতে চান।',
};

function load() {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY));
    if (Array.isArray(v) && v.length) return v;
  } catch (e) { /* ignore */ }
  return [GREETING];
}

export default function useChat() {
  const [messages, setMessages] = useState(load);
  const [loading, setLoading] = useState(false);
  const ref = useRef(messages);
  ref.current = messages;

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_KEEP))); } catch (e) { /* ignore */ }
  }, [messages]);

  const send = useCallback(async (text) => {
    const t = (text || '').trim();
    if (!t || loading) return null;
    const history = ref.current
      .filter((m) => !m.greeting && !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((p) => [...p, { id: `${Date.now()}u`, role: 'user', text: t }]);
    setLoading(true);
    try {
      const data = await askAgent({ message: t, history });
      setMessages((p) => [...p, { id: `${Date.now()}m`, role: 'model', text: data.reply || '...', action: data.action || null }]);
      return data;
    } catch (e) {
      setMessages((p) => [...p, { id: `${Date.now()}e`, role: 'model', text: e.message, error: true }]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clear = useCallback(() => setMessages([GREETING]), []);

  return { messages, loading, send, clear };
}
