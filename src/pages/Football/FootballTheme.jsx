import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* =====================================================================
   Football theme: main Home page er design language
   Barlow + Barlow Condensed · green pitch #166534 · white / #F5F6F8 bands
   scroll reveal · auto marquee · progress bar · hero parallax
   CSS ekbar-i <head> e inject hoy (sob football page share kore).
   ===================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap');

.fb {
  --surf: #FFFFFF; --surf2: #F4F4F5; --ink: #09090B; --mute: #52525B; --line: #E4E4E7;
  --acc: #166534; --deep: #166534; --fill: #166534; --on-fill: #FFFFFF; --live: #DC2626;
  font-family: 'Barlow', ui-sans-serif, system-ui, sans-serif; color: var(--ink);
  background: #fff; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;
}
.fb .fd { font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif; letter-spacing: .005em; }
.fb .b-surf { background: var(--surf); } .fb .b-surf2 { background: var(--surf2); }
.fb .b-line { border-color: var(--line); } .fb .b-mute { color: var(--mute); } .fb .b-acc { color: var(--acc); }
.fb p, .fb h1, .fb h2, .fb h3, .fb h4 { overflow-wrap: break-word; }
.fb img { max-width: 100%; }
.fb a:focus-visible, .fb button:focus-visible, .fb select:focus-visible, .fb input:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }
.fb .no-scrollbar { scrollbar-width: none; } .fb .no-scrollbar::-webkit-scrollbar { display: none; }

/* page surfaces */
.fb .fb-hero { background: #1B7D39; }
.fb .fb-main { background: repeating-linear-gradient(180deg, #F3F8F4 0 140px, #EDF5EF 140px 280px); }
.fb .band { padding: 3.5rem 0; } @media (min-width: 640px) { .fb .band { padding: 5rem 0; } }
.fb .band-w { background: #fff; }
.fb .band-b { background: #F3F8F4; --surf2: #E8F0EA; }
.fb .fbp { background: var(--surf); border: 1px solid var(--line); border-top: 3px solid var(--fill); border-radius: 1rem; }
.fb .fbp.is-live { border-top-color: var(--live); box-shadow: 0 0 0 1px rgba(220,38,38,.22), 0 20px 40px -28px rgba(220,38,38,.55); }
.fb .hd-bar { background: var(--fill); }

/* controls */
.fb .fld { display: block; width: 100%; min-width: 0; height: 3rem; padding: 0 .85rem; border: 1px solid var(--line); border-radius: .75rem; background: #fff; color: var(--ink); font-weight: 600; font-size: .95rem; color-scheme: light; transition: border-color .25s ease; }
.fb .fld:hover { border-color: var(--acc); }
.fb .fld::placeholder { color: var(--mute); font-weight: 400; }
.fb .btn-fill, .fb .btn-line, .fb .btn-gold, .fb .btn-ghost { min-height: 48px; padding: 0 1.6rem; border-radius: 9999px; font-weight: 600; font-size: .95rem; display: inline-flex; align-items: center; justify-content: center; gap: .5rem; transition: transform .25s ease, background-color .25s ease, border-color .25s ease, color .25s ease; }
.fb .btn-fill { background: var(--fill); color: #fff; } .fb .btn-fill:hover { transform: translateY(-2px); background: #14532D; }
.fb .btn-line { background: #fff; color: var(--ink); border: 1px solid var(--line); } .fb .btn-line:hover { border-color: var(--acc); color: var(--acc); }
.fb .btn-gold { background: #22C55E; color: #fff; box-shadow: 0 12px 30px -12px rgba(34,197,94,.8); } .fb .btn-gold:hover { transform: translateY(-2px); background: #15803D; }
.fb .btn-ghost { background: rgba(15,23,42,.45); border: 1px solid rgba(255,255,255,.22); color: #fff; backdrop-filter: blur(8px); } .fb .btn-ghost:hover { background: rgba(255,255,255,.12); }
.fb .chip { transition: border-color .25s ease, color .25s ease, background-color .25s ease; }
.fb .chip:hover { border-color: var(--acc); color: var(--acc); }
.fb .chip[aria-selected="true"], .fb .chip[aria-selected="true"]:hover { background: var(--fill); color: var(--on-fill); border-color: var(--fill); }

/* status */
.fb .st { font-size: .72rem; font-weight: 600; padding: .25rem .65rem; border-radius: 9999px; white-space: nowrap; }
.fb .st-ongoing { background: var(--live); color: #fff; } .fb .st-upcoming { border: 1px solid var(--fill); color: var(--fill); background: #fff; } .fb .st-completed { background: var(--surf2); color: var(--mute); }
.fb .live-chip { display: inline-flex; align-items: center; gap: .4rem; background: var(--live); color: #fff; font-size: .7rem; font-weight: 700; padding: .2rem .6rem; border-radius: 9999px; white-space: nowrap; }
.fb .live-chip i { width: 6px; height: 6px; border-radius: 9999px; background: #fff; animation: fbpulse 1.2s ease-in-out infinite; }
@keyframes fbpulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(1.5); } }
.fb .score-pop { display: inline-block; animation: scorepop .9s cubic-bezier(.2,.8,.2,1); }
@keyframes scorepop { 0% { transform: scale(1.35); color: var(--live); } 100% { transform: scale(1); } }

/* ---- pitch look: mowed grass, floodlights, drawn lines, rolling ball ---- */
.fb .grass {
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 1px, transparent 1px 7px),
    repeating-linear-gradient(0deg, rgba(0,0,0,.07) 0 1px, transparent 1px 6px),
    repeating-linear-gradient(90deg, #1B7D39 0 90px, #2A9A47 90px 180px);
  animation: grassmove 22s linear infinite;
}
/* wind ripple moving over the grass */
.fb .grass::before { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 35%, rgba(255,255,255,.16) 50%, transparent 65%); background-size: 260% 100%; animation: grasswind 7s ease-in-out infinite; }
.fb .grass::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(2,28,12,.55), transparent 62%), radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(2,28,12,.45) 100%); }
@keyframes grassmove { to { background-position: 7px 0, 0 6px, 180px 0; } }
@keyframes grasswind { 0% { background-position: 130% 0; } 100% { background-position: -30% 0; } }
.fb .grass-mini { background: repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, #1B7D39 0 30px, #2A9A47 30px 60px); }
.fb .flood { position: absolute; top: -30%; width: 45%; height: 160%; background: linear-gradient(180deg, rgba(255,255,225,.30), transparent 70%); clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%); transform-origin: 50% 0; animation: flood 6s ease-in-out infinite alternate; }
.fb .flood-l { left: 4%; } .fb .flood-r { right: 4%; animation-delay: -3s; }
@keyframes flood { from { opacity: .3; transform: rotate(-6deg); } to { opacity: .8; transform: rotate(6deg); } }
.fb .ln { stroke-dasharray: 1; stroke-dashoffset: 1; animation: fbdraw 2.2s cubic-bezier(.4,0,.2,1) .2s forwards; }
@keyframes fbdraw { to { stroke-dashoffset: 0; } }
.fb .spot { transform-box: fill-box; transform-origin: center; animation: fbpulse 2s ease-in-out infinite; }
.fb .ball-spin { transform-box: fill-box; transform-origin: center; animation: ballspin 1s linear infinite; }
@keyframes ballspin { to { transform: rotate(360deg); } }

/* motion */
.fb .rise { animation: fbrise .8s cubic-bezier(.2,.7,.2,1) both; }
@keyframes fbrise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
.fb .rv { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); transition-delay: calc(min(var(--i, 0), 8) * 50ms); }
.fb .rv-l { transform: translate3d(-30px, 0, 0); } .fb .rv-r { transform: translate3d(30px, 0, 0); } .fb .rv-z { transform: translate3d(0, 16px, 0) scale(.95); }
.fb .rv.in { opacity: 1; transform: none; }
@media (hover: hover) {
  .fb .lift { transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease; }
  .fb .lift:hover { transform: translateY(-4px); box-shadow: 0 22px 40px -24px rgba(22,101,52,.35); }
  .fb .lift .lift-img { transition: transform .8s cubic-bezier(.2,.8,.2,1); } .fb .lift:hover .lift-img { transform: scale(1.06); }
  .fb .nudge .nudge-i { transition: transform .25s ease; } .fb .nudge:hover .nudge-i { transform: translateX(5px); }
}

/* marquee */
.fb .mq { mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent); cursor: grab; touch-action: pan-y; -webkit-user-select: none; user-select: none; }
.fb .mq.dragging { cursor: grabbing; }
.fb .mq a, .fb .mq img { -webkit-user-drag: none; user-drag: none; }
.fb .mc { background: var(--surf); border: 1px solid var(--line); border-top: 3px solid var(--fill); transition: transform .25s ease, box-shadow .25s ease; }
.fb .mc:hover { transform: translateY(-3px); box-shadow: 0 18px 32px -22px rgba(22,101,52,.35); }
.fb .pc { background: var(--surf2); border: 1px solid var(--line); transition: transform .3s ease, border-color .3s ease; }
.fb .pc:hover { border-color: var(--ink); transform: translateY(-3px); }

@media (prefers-reduced-motion: reduce) {
  .fb *, .fb *::before, .fb *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .fb .rv { opacity: 1 !important; transform: none !important; }
}
`;

if (typeof document !== 'undefined') {
  // upsert: Vite hot-reload e purono <style> theke jay na, tai content ta protibar update kori
  let s = document.getElementById('fb-theme');
  if (!s) { s = document.createElement('style'); s.id = 'fb-theme'; document.head.appendChild(s); }
  s.textContent = CSS;
}

/* ------------------------- scroll reveal ------------------------- */
let io = null;
const cbs = new WeakMap();
const observe = (el, cb) => {
  if (!el) return undefined;
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) { cb(); return undefined; }
  if (!io) {
    io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) {
        const f = cbs.get(e.target);
        if (f) f();
        io.unobserve(e.target); cbs.delete(e.target);
      }
    }), { rootMargin: '0px 0px 8% 0px', threshold: 0.01 });
  }
  cbs.set(el, cb); io.observe(el);
  return () => { io.unobserve(el); cbs.delete(el); };
};

export const Rv = ({ as: Tag = 'div', i = 0, v = '', className = '', children, ...rest }) => {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => observe(ref.current, () => setOn(true)), []);
  return (
    <Tag ref={ref} className={`rv ${v ? `rv-${v}` : ''} ${on ? 'in' : ''} ${className}`} style={{ '--i': i }} {...rest}>{children}</Tag>
  );
};

/* ------------------------- count up ------------------------- */
export const CountUp = ({ value, loading }) => {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const [seen, setSeen] = useState(false);
  useEffect(() => observe(ref.current, () => setSeen(true)), []);
  useEffect(() => {
    if (loading || !seen) return undefined;
    const target = Number(value) || 0;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === 0) { setN(target); return undefined; }
    let raf; let start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 900, 1);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, loading, seen]);
  return <span ref={ref}>{loading ? '–' : n}</span>;
};

/* ------------------------- marquee (same engine as main Home) ------------------------- */
export const Marquee = ({ items, render, speed = 38, reverse = false, boost = 0.6, gap = 16 }) => {
  const wrap = useRef(null);
  const track = useRef(null);
  const pause = useRef(false);
  const vis = useRef(true);
  const base = items.length === 0 ? [] : items.length < 5 ? Array.from({ length: Math.ceil(5 / items.length) }).flatMap(() => items) : items;
  const loop = [...base, ...base];

  useEffect(() => {
    const el = track.current;
    const box = wrap.current;
    if (!el || !box || base.length === 0) return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vio = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { vis.current = e.isIntersecting; }, { rootMargin: '200px' }) : null;
    if (vio) vio.observe(el);

    let x = 0; let vel = 0; let last = performance.now(); let lastY = window.scrollY; let raf;
    let dragging = false; let captured = false; let moved = 0;
    let startPX = 0; let startX = 0; let lastPX = 0; let lastT = 0;
    const dir = reverse ? 1 : -1;

    const wrapX = () => { const half = el.scrollWidth / 2; if (half > 0) { x %= half; if (x > 0) x -= half; } };
    const apply = () => { el.style.transform = `translate3d(${x}px,0,0)`; };

    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; captured = false; moved = 0; vel = 0;
      startPX = e.clientX; startX = x; lastPX = e.clientX; lastT = performance.now();
    };
    const move = (e) => {
      if (!dragging) return;
      const dxTotal = e.clientX - startPX;
      moved = Math.max(moved, Math.abs(dxTotal));
      if (moved > 5) {
        if (!captured) { captured = true; box.classList.add('dragging'); try { box.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
        x = startX + dxTotal; wrapX(); apply();
        const now = performance.now(); const dt = (now - lastT) / 1000;
        if (dt > 0) vel = vel * 0.6 + ((e.clientX - lastPX) / dt) * 0.4;
        lastPX = e.clientX; lastT = now;
      }
    };
    const up = (e) => {
      if (!dragging) return;
      dragging = false; box.classList.remove('dragging');
      if (captured) { try { box.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
      captured = false;
      if (moved <= 5 || performance.now() - lastT > 80) vel = 0;
      vel = Math.max(-2500, Math.min(2500, vel));
    };
    const click = (e) => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } };
    const dragStart = (e) => e.preventDefault();
    const wheel = (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); x -= e.deltaX; wrapX(); apply(); } };

    box.addEventListener('pointerdown', down);
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    box.addEventListener('click', click, true);
    box.addEventListener('dragstart', dragStart);
    box.addEventListener('wheel', wheel, { passive: false });

    const tick = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05); last = t;
      const y = window.scrollY; const dy = y - lastY; lastY = y;
      const half = el.scrollWidth / 2;
      if (vis.current && half > 0 && !reduce) {
        if (!dragging) {
          if (!pause.current) x += dir * speed * dt;
          x += vel * dt;
          vel *= Math.pow(0.04, dt);
          if (Math.abs(vel) < 4) vel = 0;
        }
        x += dir * Math.max(-120, Math.min(120, dy)) * boost;
        wrapX(); apply();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf); if (vio) vio.disconnect();
      box.removeEventListener('pointerdown', down);
      box.removeEventListener('pointermove', move);
      box.removeEventListener('pointerup', up);
      box.removeEventListener('pointercancel', up);
      box.removeEventListener('click', click, true);
      box.removeEventListener('dragstart', dragStart);
      box.removeEventListener('wheel', wheel);
    };
  }, [base.length, speed, reverse, boost]);

  return (
    <div ref={wrap} className="mq overflow-hidden"
      onMouseEnter={() => { pause.current = true; }} onMouseLeave={() => { pause.current = false; }}
      onTouchStart={() => { pause.current = true; }} onTouchEnd={() => { pause.current = false; }}>
      <div ref={track} className="flex w-max will-change-transform">
        {loop.map((it, i) => (
          <div key={i} className="shrink-0" style={{ paddingRight: gap }} aria-hidden={i >= base.length ? 'true' : undefined}>{render(it)}</div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------- page frame ------------------------- */
export function PageShell({ children }) {
  const root = useRef(null);
  const bar = useRef(null);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
        const p = root.current && root.current.querySelector('[data-parallax]');
        if (p && window.scrollY < 800) p.style.transform = `translate3d(0, ${window.scrollY * 0.12}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={root} className="fb min-h-screen relative overflow-x-hidden">
      <div ref={bar} className="fixed top-0 left-0 right-0 h-[3px] z-[80] origin-left bg-[#22C55E]" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />
      {children}
    </div>
  );
}

const Pitch = () => (
  <div className="absolute inset-0" aria-hidden="true">
    <div className="grass" />
    <div className="flood flood-l" />
    <div className="flood flood-r" />
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300">
      <g fill="none" stroke="#fff" strokeWidth="2.5" strokeOpacity=".5" strokeLinecap="round">
        <rect className="ln" pathLength="1" x="20" y="20" width="760" height="260" />
        <line className="ln" pathLength="1" x1="400" y1="20" x2="400" y2="280" />
        <circle className="ln" pathLength="1" cx="400" cy="150" r="55" />
        <rect className="ln" pathLength="1" x="20" y="85" width="110" height="130" />
        <rect className="ln" pathLength="1" x="670" y="85" width="110" height="130" />
        <rect className="ln" pathLength="1" x="20" y="120" width="40" height="60" />
        <rect className="ln" pathLength="1" x="740" y="120" width="40" height="60" />
        <path className="ln" pathLength="1" d="M130 122 A30 30 0 0 1 130 178" />
        <path className="ln" pathLength="1" d="M670 122 A30 30 0 0 0 670 178" />
      </g>
      <circle className="spot" cx="400" cy="150" r="3.5" fill="#fff" fillOpacity=".8" />
      {/* rolling ball */}
      <g>
        <animateMotion dur="9s" repeatCount="indefinite" path="M90 230 C 200 60, 300 250, 400 150 S 600 40, 710 190 S 500 270, 90 230" />
        <ellipse cx="2" cy="10" rx="8" ry="2.5" fill="#000" fillOpacity=".3" />
        <g className="ball-spin">
          <circle r="9" fill="#fff" stroke="#052E16" strokeWidth="1.2" />
          <polygon points="0,-4 3.8,-1.2 2.3,3.2 -2.3,3.2 -3.8,-1.2" fill="#052E16" />
        </g>
      </g>
    </svg>
  </div>
);

export const HeroFrame = ({ children, className = '' }) => (
  <section className="fb-hero relative isolate overflow-hidden text-white">
    <div data-parallax className="absolute inset-x-0 -top-10 -bottom-10 -z-10 will-change-transform"><Pitch /></div>
    <div className={`relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-28 sm:pb-32 ${className}`}>{children}</div>
  </section>
);

export const Eyebrow = () => (
  <p className="rise flex items-center gap-3 text-sm sm:text-base text-white/85 mb-4 font-medium">
    <span className="block h-[2px] w-8 bg-[#22C55E]"></span>Brahmaputra International University Football
  </p>
);

export const PageHero = ({ title, sub }) => (
  <HeroFrame>
    <Eyebrow />
    <h1 className="rise fd font-bold leading-[.95] text-[clamp(2.75rem,8vw,5.5rem)]" style={{ animationDelay: '.08s' }}>{title}</h1>
    {sub && <p className="rise text-white/75 text-base sm:text-lg max-w-xl leading-relaxed mt-4" style={{ animationDelay: '.16s' }}>{sub}</p>}
  </HeroFrame>
);

/* ------------------------- small pieces ------------------------- */
export const SectionHead = ({ title, sub, to, cta }) => (
  <Rv className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-6 sm:mb-9">
    <div className="min-w-0 max-w-2xl">
      <h2 className="fd text-[2rem] sm:text-5xl font-bold leading-none text-[var(--ink)]">{title}</h2>
      <span className="hd-bar block h-1 w-14 rounded-full mt-4"></span>
      {sub && <p className="text-sm sm:text-base mt-3 b-mute">{sub}</p>}
    </div>
    {to && (
      <Link to={to} className="nudge inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold shrink-0 b-acc hover:underline">
        {cta || 'View all'}
        <svg viewBox="0 0 24 24" className="w-4 h-4 nudge-i" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    )}
  </Rv>
);

export const Empty = ({ title, text, children }) => (
  <div className="rounded-2xl border border-dashed border-[#D4D4D8] bg-white px-6 py-12 text-center">
    {title && <p className="fd text-2xl font-bold text-[var(--ink)]">{title}</p>}
    {text && <p className="b-mute mt-1">{text}</p>}
    {children}
  </div>
);

export const Skeleton = ({ n = 3, h = 'h-44', cols = 'grid-cols-1' }) => (
  <div className={`grid gap-4 ${cols}`} aria-hidden="true">
    {Array.from({ length: n }).map((_, i) => <div key={i} className={`${h} rounded-2xl bg-[#E4E4E7]/70 animate-pulse`} />)}
  </div>
);

export const Logo = ({ t, size = 'w-12 h-12' }) => (t?.logo
  ? <img src={t.logo} alt="" className={`${size} rounded-full object-cover bg-white border-2 border-[var(--line)] shrink-0`} />
  : <span className={`${size} rounded-full bg-[var(--fill)] text-white grid place-items-center text-[13px] font-bold shrink-0`}>{(t?.shortName || t?.name || '?').slice(0, 3)}</span>);

export const LiveChip = ({ minute }) => <span className="live-chip"><i></i> Live{minute != null && minute !== '' ? ` ${minute}'` : ''}</span>;

export const STATUS_LABEL = { ongoing: 'Live now', upcoming: 'Upcoming', completed: 'Completed' };