import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export const ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const BASE = '/sports/table-tennis'; // menu path (Badminton)
const API = axios.create({ baseURL: `${ROOT}/api/badminton`, timeout: 15000 });
export const img = (p) => (!p ? '' : /^https?:|^data:/.test(p) ? p : `${ROOT}${p}`);
export const initials = (n = '') => n.split(/[\s/]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
export const fmtDate = (d, withTime = true) => (d ? new Date(d).toLocaleString([], withTime ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA');

/* ---------- GET cache + dedupe ---------- */
// Ek-i URL bar bar fetch hobe na: 30s fresh thakle network call hobe na,
// purono data thakle sathe sathe dekhabe, background e refresh hobe.
const TTL = 30000;
const cache = new Map();    // url -> { data, t }
const inflight = new Map(); // url -> Promise (same time e 2 jaygay same call hole ekta-i jabe)

// Refresh dileo jeno loading na dekhay: cache localStorage e save thake.
const LS_KEY = 'bd:cache:v1';
const MAX_AGE = 24 * 3600 * 1000; // 1 din er purono hole felе dei
const MAX_ENTRIES = 40;
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  saved.forEach(([k, v]) => { if (v && Date.now() - v.t < MAX_AGE) cache.set(k, v); });
} catch (e) { /* ignore */ }
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const arr = [...cache.entries()].slice(-MAX_ENTRIES);
      localStorage.setItem(LS_KEY, JSON.stringify(arr));
    } catch (e) { /* storage full / private mode: ignore */ }
  }, 500);
}

function fetchCached(url, force) {
  const hit = cache.get(url);
  if (!force && hit && Date.now() - hit.t < TTL) return Promise.resolve(hit.data);
  if (inflight.has(url)) return inflight.get(url);
  const p = API.get(url)
    .then((r) => { cache.set(url, { data: r.data, t: Date.now() }); persist(); return r.data; })
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

// simple GET hook
export function useGet(url, deps = []) {
  const [data, setData] = useState(() => (url && cache.get(url) ? cache.get(url).data : null));
  const [loading, setLoading] = useState(() => !!url && !cache.has(url));
  const [error, setError] = useState('');
  const seq = useRef(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback((force) => {
    if (!url) { setData(null); setLoading(false); return Promise.resolve(); }
    const id = ++seq.current;
    const hit = cache.get(url);
    if (hit) { setData(hit.data); setLoading(false); } // cached data sathe sathe
    else setLoading(true);
    return fetchCached(url, force)
      .then((d) => { if (alive.current && id === seq.current) { setData(d); setError(''); } })
      .catch((e) => { if (alive.current && id === seq.current) setError(e?.response?.data?.error || e.message); })
      .finally(() => { if (alive.current && id === seq.current) setLoading(false); });
  }, [url]);

  useEffect(() => { load(false); }, [load, ...deps]); // eslint-disable-line
  const reload = useCallback(() => load(true), [load]); // live update e force refresh, spinner/flicker nai
  return { data, setData, loading, error, reload };
}

/* ---------- shared socket (puro app e matro 1ta connection) ---------- */
let sock = null;
let users = 0;
let closeTimer = null;
function acquire() {
  clearTimeout(closeTimer);
  if (!sock) sock = io(ROOT, { transports: ['websocket', 'polling'] });
  users += 1;
  return sock;
}
function release() {
  users -= 1;
  if (users > 0) return;
  // page change e sathe sathe disconnect na kore 5s opekkha kori
  closeTimer = setTimeout(() => { if (users <= 0 && sock) { sock.disconnect(); sock = null; } }, 5000);
}

// server 'bd:match:update' event pele callback chole
export function useLiveSocket(onUpdate) {
  const ref = useRef(onUpdate);
  ref.current = onUpdate;
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const s = acquire();
    const on = (m) => ref.current && ref.current(m);
    const up = () => setConnected(true);
    const down = () => setConnected(false);
    s.on('bd:match:update', on);
    s.on('connect', up);
    s.on('disconnect', down);
    setConnected(s.connected);
    return () => { s.off('bd:match:update', on); s.off('connect', up); s.off('disconnect', down); release(); };
  }, []);
  return connected;
}

// Proti point e reload na kore, kichhukkhon opekkha kore ekbar reload
export function useDebounced(fn, ms = 800) {
  const ref = useRef(fn);
  ref.current = fn;
  const t = useRef(null);
  useEffect(() => () => clearTimeout(t.current), []);
  return useCallback((...a) => { clearTimeout(t.current); t.current = setTimeout(() => ref.current(...a), ms); }, [ms]);
}

export default API;