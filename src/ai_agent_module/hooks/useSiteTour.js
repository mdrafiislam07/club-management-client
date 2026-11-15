import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SPEED = 4.2;                  // ager 6x theke 30% dhire                    // 1 = dhire, 6 = 6x druto
const LOAD_WAIT = 1500;             // page load + data fetch
const END_PAUSE = 4000 / SPEED;
const MIN_SCROLL = 8000 / SPEED;
const MAX_SCROLL = 40000 / SPEED;
const MS_PER_PX = 12 / SPEED;

const sleep = (ms, sig) =>
  new Promise((res) => {
    if (sig.aborted) return res();
    const t = setTimeout(res, ms);
    sig.addEventListener('abort', () => { clearTimeout(t); res(); }, { once: true });
  });

function smoothScroll(sig) {
  return new Promise((resolve) => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return resolve();
    const duration = Math.min(MAX_SCROLL, Math.max(MIN_SCROLL, total * MS_PER_PX));
    const start = performance.now();
    const tick = (now) => {
      if (sig.aborted) return resolve();
      const p = Math.min((now - start) / duration, 1);
      window.scrollTo(0, total * p);
      p < 1 ? requestAnimationFrame(tick) : resolve();
    };
    requestAnimationFrame(tick);
  });
}

// Current page-er <a> link theke :id wala details page khuje ber kora
function findLinks({ prefixes, max }, visited) {
  const found = [];
  for (const a of document.querySelectorAll('a[href]')) {
    let u;
    try { u = new URL(a.href, window.location.origin); } catch (e) { continue; }
    if (u.origin !== window.location.origin) continue;
    const key = u.pathname + u.search;
    if (visited.has(key) || found.includes(key)) continue;
    if (prefixes.some((p) => key.startsWith(p) && key !== p)) found.push(key);
    if (found.length >= max) break;
  }
  return found;
}

export default function useSiteTour({ onStep } = {}) {
  const navigate = useNavigate();
  const ctrl = useRef(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ i: 0, n: 0, label: '' });

  const stop = useCallback(() => {
    ctrl.current?.abort();
    ctrl.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(async (steps) => {
    if (!Array.isArray(steps) || !steps.length) return;
    ctrl.current?.abort();
    const ac = new AbortController();
    ctrl.current = ac;
    const sig = ac.signal;
    setRunning(true);

    const userStop = () => stop();
    window.addEventListener('wheel', userStop, { passive: true });
    window.addEventListener('touchstart', userStop, { passive: true });
    window.addEventListener('keydown', userStop);

    const queue = [...steps];
    const visited = new Set(queue.map((s) => s.url));

    try {
      for (let i = 0; i < queue.length && !sig.aborted; i++) {
        const s = queue[i];
        setProgress({ i: i + 1, n: queue.length, label: s.label });
        navigate(s.url);
        window.scrollTo(0, 0);
        onStep?.(s);
        await sleep(LOAD_WAIT, sig);
        if (sig.aborted) break;

        // :id wala details page discover kora (data load hote deri hole 6 bar porjonto abar dekhbe)
        if (s.discover) {
          let found = findLinks(s.discover, visited);
          for (let t = 0; t < 6 && !found.length && !sig.aborted; t++) {
            await sleep(300, sig);
            found = findLinks(s.discover, visited);
          }
          if (found.length) {
            found.forEach((u) => visited.add(u));
            queue.splice(i + 1, 0, ...found.map((u) => ({ url: u, label: `${s.label} - বিস্তারিত` })));
            setProgress({ i: i + 1, n: queue.length, label: s.label });
          }
        }

        await smoothScroll(sig);
        await sleep(END_PAUSE, sig);
      }
    } finally {
      window.removeEventListener('wheel', userStop);
      window.removeEventListener('touchstart', userStop);
      window.removeEventListener('keydown', userStop);
      if (ctrl.current === ac) { ctrl.current = null; setRunning(false); }
    }
  }, [navigate, onStep, stop]);

  useEffect(() => () => ctrl.current?.abort(), []);

  return { running, progress, start, stop };
}