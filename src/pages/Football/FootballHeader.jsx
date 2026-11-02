import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from './logo.jpg'; // client/src/pages/Football/logo.jpg

const LINKS = [
  { to: '/sports/football', label: 'Home', end: true },
  { to: '/sports/football/tournament', label: 'Tournaments' },
  { to: '/sports/football/team', label: 'Teams' },
  { to: '/sports/football/schedule', label: 'Schedule' },
  { to: '/sports/football/point-table', label: 'Point Table' },
  { to: '/sports/football/auction', label: 'Auction' }
];

/* Palette (same as FootballHome)
   bg #eaf2ff→#f6f9ff · ink #0a1f5c · soft #475569 · line #c7d7f5
   gold #1f5eff (active, focus) · cyan #0ea5e9 (Main site link) · violet #4f46e5 · button text white
   Header is always dark, matching the page below it. */

const focus =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5eff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f8ff]';

const bar = 'w-[22px] h-[2.5px] rounded bg-[#0a1f5c] transition-transform motion-reduce:transition-none';

export default function FootballHeader() {
  const [open, setOpen] = useState(false);

  // desktop nav link
  const cls = ({ isActive }) =>
    `relative px-3.5 py-2 rounded-lg text-[15px] font-semibold transition-colors motion-reduce:transition-none ${focus} ${
      isActive
        ? 'text-[#1f5eff] bg-[#1f5eff]/10 border border-[#1f5eff]/35 after:content-[""] after:absolute after:left-3 after:right-3 after:-bottom-[9px] after:h-[3px] after:rounded-full after:bg-[#1f5eff] after:shadow-[0_0_12px_#1f5eff] max-lg:after:hidden'
        : 'text-[#0a1f5c] border border-transparent hover:text-[#1f5eff] hover:bg-[#e8f0ff]'
    }`;

  // mobile menu link
  const mobileCls = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-semibold transition-colors motion-reduce:transition-none ${focus} ${
      isActive
        ? 'text-[#1f5eff] bg-[#1f5eff]/10 border border-[#1f5eff]/35'
        : 'text-[#0a1f5c] border border-transparent hover:bg-[#e8f0ff]'
    }`;

  const mainSite = `px-3.5 py-2 rounded-lg text-[15px] font-bold text-[#0369a1] bg-[#0ea5e9]/10 border border-[#0ea5e9]/35 hover:brightness-95 transition ${focus}`;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur text-[#0a1f5c] shadow-[0_10px_30px_-18px_rgba(10,31,92,0.35)]">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* logo + club name */}
        <Link to="/sports/football" onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl ${focus}`}>
          <img
            src={logo}
            alt="BRIU Sports Club logo"
            width="48"
            height="48"
            className="w-12 h-12 rounded-xl bg-white object-cover shrink-0 ring-1 ring-[#c7d7f5] shadow-[0_8px_24px_-10px_rgba(31,94,255,0.45)]"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
          />
          <span className="leading-none">
            <span className="block font-['Barlow_Condensed'] text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-[linear-gradient(100deg,#0a1f5c_30%,#1f5eff_75%)]">
              BRIU Sports Club
            </span>
            <span className="block text-[13px] font-semibold text-[#0369a1] mt-0.5">Football</span>
          </span>
        </Link>

        {/* desktop */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Football">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={cls}>{l.label}</NavLink>
          ))}
          <span className="w-px h-6 bg-[#dbe7ff] mx-2" aria-hidden="true" />
          <Link to="/" className={mainSite}>Main site</Link>
        </nav>

        {/* phone: hamburger */}
        <button
          className={`lg:hidden w-11 h-11 rounded-xl bg-[#e8f0ff] border border-[#c7d7f5] flex flex-col items-center justify-center gap-[5px] hover:bg-[#dbe7ff] transition-colors ${focus}`}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className={`${bar} ${open ? 'translate-y-[7.5px] rotate-45' : ''}`} />
          <span className={`${bar} ${open ? 'opacity-0' : ''}`} />
          <span className={`${bar} ${open ? '-translate-y-[7.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* gold → cyan accent line (replaces the old blue border) */}
      <div className="h-[3px] bg-[linear-gradient(90deg,#1f5eff,#3b82f6_55%,#0ea5e9)] shadow-[0_0_18px_rgba(31,94,255,0.45)]" aria-hidden="true" />

      {/* phone menu */}
      {open && (
        <nav className="lg:hidden bg-white/95 border-b border-[#c7d7f5]" aria-label="Football mobile">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1.5">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={mobileCls} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <div className="h-px bg-[#e8f0ff] my-2" />
            <Link to="/" onClick={() => setOpen(false)} className={`${mainSite} text-center py-3`}>Main site</Link>
          </div>
        </nav>
      )}
    </header>
  );
}