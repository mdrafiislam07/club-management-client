// আপনার বিদ্যমান api.js ছোঁয়া হয়নি; এখানে আলাদা fetch ব্যবহার হচ্ছে।
const ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function askAgent({ message, history }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(`${ROOT}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('উত্তর পেতে বেশি সময় লাগছে, আবার চেষ্টা করুন।');
    if (e instanceof TypeError) throw new Error('সার্ভারের সাথে সংযোগ হচ্ছে না।');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
