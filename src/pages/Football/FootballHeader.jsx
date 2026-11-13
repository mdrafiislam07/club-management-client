import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './FootballTheme'; // theme CSS (fonts + .fb styles) inject kore
import logo from './logo.jpg'; // client/src/pages/Football/logo.jpg

const LINKS = [
  { to: '/sports/football', label: 'Home', end: true },
  { to: '/sports/football/tournament', label: 'Tournaments' },
  { to: '/sports/football/team', label: 'Teams' },
  { to: '/sports/football/schedule', label: 'Schedule' },
  { to: '/sports/football/point-table', label: 'Point Table' },
  { to: '/sports/football/auction', label: 'Auction' }
];

/* Main Home er moto: white bar, navy active pill, Barlow Condensed logo text */
const bar = 'w-[22px] h-[2.5px] rounded bg-[#166534] transition-transform motion-reduce:transition-none';

export default function FootballHeader() {
  const [open, setOpen] = useState(false);

  const cls = ({ isActive }) =>
    `px-3.5 py-2 rounded-full text-[15px] font-semibold transition-colors motion-reduce:transition-none ${
      isActive ? 'bg-[#166534] text-white' : 'text-[#09090B] hover:bg-[#F4F4F5] hover:text-[#166534]'
    }`;

  const mobileCls = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-colors motion-reduce:transition-none ${
      isActive ? 'bg-[#166534] text-white' : 'text-[#09090B] hover:bg-[#F4F4F5]'
    }`;

  const mainSite = 'px-4 py-2 rounded-full text-[15px] font-semibold text-[#166534] border border-[#E4E4E7] hover:border-[#166534] transition-colors';

  return (
    <header className="fb sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E4E4E7]">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <Link to="/sports/football" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl">
          <img
            src={logo}
            alt="BRIU Sports Club logo"
            width="48"
            height="48"
            className="w-12 h-12 rounded-xl bg-white object-cover shrink-0 border border-[#E4E4E7]"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
          />
          <span className="leading-none">
            <span className="fd block text-2xl font-bold text-[#166534]">BRIU Sports Club</span>
            <span className="block text-[13px] font-medium text-[#52525B] mt-0.5">Football</span>
          </span>
        </Link>

        {/* desktop */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Football">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={cls}>{l.label}</NavLink>
          ))}
          <span className="w-px h-6 bg-[#E4E4E7] mx-2" aria-hidden="true" />
          <Link to="/" className={mainSite}>Main site</Link>
        </nav>

        {/* phone: hamburger */}
        <button
          className="lg:hidden w-11 h-11 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] flex flex-col items-center justify-center gap-[5px] hover:bg-[#E4E4E7] transition-colors"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className={`${bar} ${open ? 'translate-y-[7.5px] rotate-45' : ''}`} />
          <span className={`${bar} ${open ? 'opacity-0' : ''}`} />
          <span className={`${bar} ${open ? '-translate-y-[7.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* phone menu: smooth height open/close */}
      <div
        className={`lg:hidden grid transition-[grid-template-rows,visibility] duration-300 motion-reduce:transition-none ${open ? 'grid-rows-[1fr] visible' : 'grid-rows-[0fr] invisible'}`}
        aria-hidden={!open}
      >
        <nav className="overflow-hidden" aria-label="Football mobile">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1.5 border-t border-[#E4E4E7]">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={mobileCls} onClick={() => setOpen(false)}>{l.label}</NavLink>
            ))}
            <div className="h-px bg-[#E4E4E7] my-2" />
            <Link to="/" onClick={() => setOpen(false)} className={`${mainSite} text-center py-3`}>Main site</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}