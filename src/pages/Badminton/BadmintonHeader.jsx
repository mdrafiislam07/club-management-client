import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { BASE } from './bdApi';

export const TABS = [
  { to: BASE, label: 'Overview', end: true },
  { to: `${BASE}/tournament`, label: 'Tournaments' },
  { to: `${BASE}/team`, label: 'Teams' },
  { to: `${BASE}/players`, label: 'Players' },
  { to: `${BASE}/live`, label: 'Live', live: true },
  { to: `${BASE}/schedule`, label: 'Schedule' },
  { to: `${BASE}/point-table`, label: 'Point Table' },
  { to: `${BASE}/projector`, label: 'Projector' },
];

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

const LiveDot = () => <span className="bx-live" aria-hidden="true" />;

export default function BadmintonHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const ref = useRef(null);

  // header compact on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // phone menu: close on Escape or click outside
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  const desktopCls = 'bx-link flex items-center gap-1.5 py-1 text-sm';
  const mobileCls = ({ isActive }) =>
    `bx-mlink flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-amber-400/20 to-transparent shadow-[inset_3px_0_0_#fbbf24]'
        : 'hover:bg-sky-500/10'
    }`;

  return (
    <>
      <style>{`
        @keyframes bx-drop { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bx-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,.6); } 50% { box-shadow:0 0 0 6px rgba(239,68,68,0); } }
        .bx-line { background: linear-gradient(90deg, transparent, #38bdf8, #fbbf24, #38bdf8, transparent); }
        .bx-live { display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; animation: bx-pulse 1.6s ease infinite; }

        /* desktop links */
        header.bx-header a.bx-link {
          position: relative; white-space: nowrap;
          color: #e2e8f0 !important;
          font-weight: 600;
          transition: color .3s ease, text-shadow .3s ease;
        }
        header.bx-header a.bx-link::after {
          content:''; position:absolute; left:50%; bottom:-6px; height:2px; width:0; border-radius:2px;
          background: linear-gradient(90deg,#fbbf24,#fcd34d);
          box-shadow: 0 0 8px rgba(251,191,36,.7);
          transform: translateX(-50%); transition: width .3s ease;
        }
        header.bx-header a.bx-link:hover { color:#fde68a !important; text-shadow: 0 0 12px rgba(251,191,36,.5); }
        header.bx-header a.bx-link:hover::after,
        header.bx-header a.bx-link[aria-current='page']::after { width:100%; }
        header.bx-header a.bx-link[aria-current='page'] { color:#fcd34d !important; text-shadow: 0 0 12px rgba(251,191,36,.45); }

        /* mobile links */
        header.bx-header a.bx-mlink { color:#cbd5e1 !important; }
        header.bx-header a.bx-mlink[aria-current='page'] { color:#fcd34d !important; }
        header.bx-header a.bx-mlink:hover { color:#fde68a !important; }

        /* "Main site" button */
        header.bx-header a.bx-main { color:#e0f2fe !important; }
        header.bx-header a.bx-main:hover { color:#fde68a !important; }

        /* brand text */
        header.bx-header .bx-brand-title { color:#f8fafc !important; }
        header.bx-header .bx-brand-sub { color:#fcd34d !important; }

        .bx-menu { animation: bx-drop .25s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .bx-menu, .bx-live { animation: none !important; }
          header.bx-header a.bx-link, header.bx-header a.bx-link::after { transition: none !important; }
        }
      `}</style>

      <header
        ref={ref}
        style={{ backgroundColor: scrolled ? 'rgba(10,18,36,0.96)' : 'rgba(10,18,36,0.88)' }}
        className={`bx-header sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 ${
          scrolled
            ? 'shadow-[0_10px_30px_-12px_rgba(56,189,248,0.35)]'
            : 'shadow-[0_6px_24px_-14px_rgba(56,189,248,0.25)]'
        }`}
      >
        {/* soft static ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-1/2 h-24 w-56 -translate-y-1/2 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="absolute -right-10 top-1/2 h-24 w-56 -translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className={`relative max-w-6xl mx-auto px-4 flex items-center justify-between gap-3 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3.5'}`}>
          {/* logo -> badminton home */}
          <Link
            to={BASE}
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <div className="relative h-11 w-11 flex-shrink-0">
              <span className="absolute -inset-1.5 rounded-full bg-amber-400/25 blur-md transition-opacity duration-300 group-hover:bg-amber-400/40" />
              <span className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-sky-400" />
              <div className="relative h-full w-full rounded-full bg-[#0a1224] p-[2px] transition-transform duration-300 group-hover:scale-105">
                {logoOk ? (
                  <img
                    src="/logo.png"
                    alt="BRIU Sports Club logo"
                    width="44"
                    height="44"
                    className="h-full w-full rounded-full object-cover"
                    onError={() => setLogoOk(false)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-blue-900 text-lg">
                    🏸
                  </div>
                )}
              </div>
            </div>

            <span className="flex flex-col leading-tight">
              <span className="bx-brand-title text-xl font-extrabold tracking-wide [text-shadow:0_0_16px_rgba(56,189,248,0.35)]">
                BRIU Sports Club
              </span>
              <span className="bx-brand-sub flex items-center gap-1.5 text-xs font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                Badminton
              </span>
            </span>
          </Link>

          {/* desktop (8 ta tab, tai xl theke) */}
          <nav aria-label="Badminton" className="hidden xl:flex items-center gap-5">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={desktopCls}>
                {t.live && <LiveDot />}
                {t.label}
              </NavLink>
            ))}

            <span className="mx-1 h-6 w-px bg-sky-400/25" aria-hidden="true" />

            <Link
              to="/"
              className="bx-main flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3.5 py-1.5 text-sm font-semibold shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all duration-300 hover:border-amber-300/60 hover:shadow-[0_0_16px_rgba(251,191,36,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <HomeIcon />
              Main site
            </Link>
          </nav>

          {/* phone / tablet: hamburger */}
          <div className="xl:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className={`relative rounded-xl border p-2 text-slate-100 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                open
                  ? 'border-amber-300/60 bg-amber-400/15 shadow-[0_0_16px_rgba(251,191,36,0.4)]'
                  : 'border-sky-400/30 bg-sky-500/10 shadow-[0_0_10px_rgba(56,189,248,0.25)] hover:shadow-[0_0_16px_rgba(251,191,36,0.4)]'
              }`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {open
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* phone dropdown */}
        {open && (
          <div
            style={{ backgroundColor: 'rgb(10,18,36)' }}
            className="bx-menu xl:hidden relative border-t border-sky-400/20 shadow-[0_20px_40px_-15px_rgba(56,189,248,0.35)]"
          >
            <nav aria-label="Badminton mobile" className="max-w-6xl mx-auto px-4 pt-3 pb-5 flex flex-col gap-1.5 font-medium">
              {TABS.map((t) => (
                <NavLink key={t.to} to={t.to} end={t.end} className={mobileCls} onClick={() => setOpen(false)}>
                  {t.live && <LiveDot />}
                  {t.label}
                </NavLink>
              ))}

              <div className="my-2 h-px bg-sky-400/20" />

              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="bx-main flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-4 py-2.5 font-semibold transition-colors duration-200 hover:border-amber-300/60"
              >
                <HomeIcon />
                Main site
              </Link>
            </nav>
          </div>
        )}

        {/* static neon bottom line */}
        <div className="bx-line absolute bottom-0 left-0 h-[2px] w-full shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
      </header>
    </>
  );
}