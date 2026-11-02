import React, { useState } from 'react';
import FAPI, { usePolling } from './footballApi';

/* Palette (same as the Cricket home)
   bg #eaf2ff→#f6f9ff · ink #0a1f5c · soft #475569 · line #c7d7f5
   blue #1f5eff · sky #0ea5e9 · indigo #4f46e5 · live #e11d48 · button text white */

const GOLD = '#1f5eff';
const CYAN = '#0369a1';
const VIOLET = '#4f46e5';

const tint = (pct) => `color-mix(in srgb, var(--accent, ${GOLD}) ${pct}%, transparent)`;
const glass = 'bg-gradient-to-b from-white to-[#f4f8ff] border border-[#c7d7f5]';
const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5eff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f8ff]';
const primaryBtn = 'bg-[linear-gradient(100deg,#1f5eff,#2563eb_50%,#0369a1)] text-white font-bold shadow-[0_12px_40px_-10px_rgba(31,94,255,0.55)] hover:brightness-105 transition';
const field = `block w-full max-w-full min-w-0 h-12 px-3 rounded-xl border border-[#cfdcf7] bg-white/70 text-[#0a1f5c] font-semibold [color-scheme:light] ${focusRing}`;

const STATUS = [['all', 'All'], ['live', 'Live'], ['upcoming', 'Upcoming'], ['completed', 'Results']];
const EVENT_ICON = { goal: '⚽', yellow: '🟨', red: '🟥', sub: '🔁' };

const Ambient = () => (
  <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
    <span className="absolute rounded-full w-[560px] h-[560px] -top-44 -left-36 opacity-[0.18]" style={{ background: `radial-gradient(closest-side, ${GOLD} 35%, transparent 100%)` }} />
    <span className="absolute rounded-full w-[520px] h-[520px] top-[35%] -right-44 opacity-[0.22]" style={{ background: 'radial-gradient(closest-side, #1f5eff 35%, transparent 100%)' }} />
    <span className="absolute rounded-full w-[480px] h-[480px] -bottom-44 left-[20%] opacity-[0.16]" style={{ background: `radial-gradient(closest-side, ${VIOLET} 35%, transparent 100%)` }} />
    <span className="absolute inset-0" style={{
      backgroundImage: 'linear-gradient(rgba(31,94,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(31,94,255,.06) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      WebkitMaskImage: 'radial-gradient(ellipse at 50% 20%, #000, transparent 72%)',
      maskImage: 'radial-gradient(ellipse at 50% 20%, #000, transparent 72%)'
    }} />
  </div>
);

const Crest = ({ t }) => t?.logo
  ? <img src={t.logo} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover bg-white ring-1 ring-[#c7d7f5] shrink-0" />
  : <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1f5eff] text-white grid place-items-center text-[13px] font-bold shrink-0">{(t?.shortName || t?.name || '?').slice(0, 3)}</span>;

const StatusPill = ({ m }) => {
  if (m.status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#e11d48] text-white text-[13px] font-bold px-2.5 py-1 rounded-full shrink-0 shadow-[0_0_22px_-4px_#e11d48]">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE {m.minute}'
      </span>
    );
  }
  if (m.status === 'completed') {
    return <span className="text-[13px] font-bold px-2.5 py-1 rounded-full bg-[#e8f0ff] text-[#475569] shrink-0">Full time</span>;
  }
  return <span className="text-[13px] font-bold px-2.5 py-1 rounded-full bg-[#0ea5e9]/15 text-[#0369a1] border border-[#0ea5e9]/35 shrink-0">Upcoming</span>;
};

// team A sits on the left (name, then crest next to the score); team B mirrors it. Phone: crest above name.
const Team = ({ t, right }) => (
  <div className={`flex flex-col items-center gap-2 text-center min-w-0 sm:gap-4 ${right ? 'sm:flex-row sm:text-left' : 'sm:flex-row-reverse sm:text-right'}`}>
    <Crest t={t} />
    <span className="text-sm sm:text-lg font-semibold leading-tight line-clamp-2 break-words text-[#0a1f5c] min-w-0">{t?.name}</span>
  </div>
);

const MatchCard = ({ m }) => {
  const footer = [m.time, m.venue].filter(Boolean).join(' · ');
  return (
    <article className={`${glass} rounded-2xl p-4 sm:p-6 shadow-[0_14px_36px_-20px_rgba(10,31,92,0.4)] hover:border-[#1f5eff]/40 transition-colors ${
      m.status === 'live' ? '!border-[#e11d48] ring-1 ring-[#e11d48]/30 shadow-[0_0_60px_-24px_#e11d48]' : ''}`}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-[13px] sm:text-sm text-[#475569] truncate min-w-0">{m.tournament?.name}{m.round && ` · ${m.round}`}</p>
        <StatusPill m={m} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <Team t={m.teamA} />
        <div className="text-center px-1 sm:px-4 min-w-[84px]">
          <b className="block font-['Barlow_Condensed'] text-4xl sm:text-5xl leading-none text-[#0a1f5c] whitespace-nowrap">
            {m.status === 'upcoming' ? 'vs' : `${m.scoreA} - ${m.scoreB}`}
          </b>
          {m.status === 'upcoming' && m.time && <span className="block mt-1 text-[13px] sm:text-sm font-semibold text-[#0369a1]">{m.time}</span>}
        </div>
        <Team t={m.teamB} right />
      </div>

      {footer && (
        <p className="mt-5 pt-4 border-t border-[#c7d7f5] text-[13px] sm:text-sm text-center text-[#475569] truncate">{footer}</p>
      )}

      {m.events?.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {m.events.map((ev, i) => (
            <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-[#c7d7f5] px-3 py-1 text-[13px] sm:text-sm text-[#0a1f5c]">
              {ev.minute != null && <b className="text-[#1f5eff]">{ev.minute}'</b>}
              <span aria-hidden="true">{EVENT_ICON[ev.type] || '•'}</span>
              <span>{ev.player || (ev.team === 'A' ? m.teamA?.name : m.teamB?.name)}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

const dateKey = (m) => { const d = new Date(m.date); return isNaN(d) ? 'tba' : d.toDateString(); };
const dayLabel = (k, date) => (k === 'tba'
  ? 'Date to be announced'
  : new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

const Skeleton = () => (
  <div className="space-y-4" aria-hidden="true">
    {[0, 1, 2].map((i) => <div key={i} className={`h-44 rounded-2xl ${glass} animate-pulse`} />)}
  </div>
);

export default function FootballSchedule() {
  const [matches, setMatches] = useState([]);
  const [tours, setTours] = useState([]);
  const [tid, setTid] = useState('');
  const [st, setSt] = useState('all');
  const [loading, setLoading] = useState(true);

  usePolling(async () => {
    try {
      const [m, t] = await Promise.all([FAPI.get('/matches'), FAPI.get('/tournaments')]);
      setMatches(m.data); setTours(t.data);
    } catch (e) { /* retry next poll */ } finally { setLoading(false); }
  }, 5000);

  const base = matches.filter((m) => !tid || m.tournament?._id === tid);
  const count = (k) => (k === 'all' ? base.length : base.filter((m) => m.status === k).length);
  const shown = base.filter((m) => st === 'all' || m.status === st);

  const liveNow = st === 'all' ? shown.filter((m) => m.status === 'live') : [];
  const rest = st === 'all' ? shown.filter((m) => m.status !== 'live') : shown;

  const dir = st === 'completed' ? -1 : 1;
  const sorted = [...rest].sort((a, b) => ((new Date(a.date) - new Date(b.date)) || (a.time || '').localeCompare(b.time || '')) * dir);
  const groups = [];
  sorted.forEach((m) => {
    const k = dateKey(m);
    let g = groups[groups.length - 1];
    if (!g || g.k !== k) { g = { k, date: m.date, items: [] }; groups.push(g); }
    g.items.push(m);
  });
  const today = new Date().toDateString();

  return (
    /* "dark" class keeps any child component's dark: styles on (class-based dark mode) */
    <div className="[color-scheme:light] relative isolate bg-[linear-gradient(160deg,#dce8ff,#eef3ff_40%,#e3e8ff)] text-[#0a1f5c] min-h-screen overflow-x-hidden" style={{ '--accent': GOLD }}>
      <Ambient />

      {/* ---------- Page header ---------- */}
      <div className="relative overflow-hidden border-b border-[#c7d7f5]">
        <svg className="absolute inset-0 w-full h-full text-[#1f5eff] opacity-[0.07]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="3"><rect x="20" y="20" width="760" height="260" /><line x1="400" y1="20" x2="400" y2="280" />
            <circle cx="400" cy="150" r="55" /><rect x="20" y="85" width="110" height="130" /><rect x="670" y="85" width="110" height="130" /></g>
        </svg>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 pb-20 sm:pb-24">
          <h1 className="font-['Barlow_Condensed'] text-5xl sm:text-6xl md:text-7xl font-bold leading-none text-[#0a1f5c]">Schedule and results</h1>
          <p className="mt-3 text-base sm:text-lg text-[#475569] max-w-xl">Live scores, upcoming fixtures and final results from every tournament.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-14">
        {/* ---------- Filter panel (overlaps header) ---------- */}
        <section className={`-mt-12 sm:-mt-14 relative z-10 ${glass} rounded-2xl p-4 sm:p-6 shadow-[0_14px_36px_-20px_rgba(10,31,92,0.4)]`} aria-label="Filters">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-end">
            <label className="block min-w-0">
              <span className="block text-sm font-semibold text-[#475569] mb-1.5">Tournament</span>
              <select value={tid} onChange={(e) => setTid(e.target.value)} aria-label="Tournament" className={field}>
                <option value="">All tournaments</option>
                {tours.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </label>

            <div className="min-w-0">
              <span className="block text-sm font-semibold text-[#475569] mb-1.5">Match status</span>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
                {STATUS.map(([k, label]) => (
                  <button key={k} role="tab" aria-selected={st === k} onClick={() => setSt(k)}
                    className={`shrink-0 inline-flex items-center gap-2 h-12 px-4 rounded-xl text-sm font-semibold transition-colors ${focusRing} ${
                      st === k ? 'bg-[#1f5eff] text-white shadow-[0_10px_30px_-8px_#1f5eff]' : 'bg-[#e8f0ff] text-[#475569] hover:bg-[#dbe7ff] hover:text-[#0a1f5c]'}`}>
                    {k === 'live' && count('live') > 0 && <span className="w-2 h-2 rounded-full bg-[#e11d48] animate-pulse" />}
                    {label}
                    <span className={`text-[13px] px-1.5 rounded-full ${st === k ? 'bg-white/25' : 'bg-[#e8f0ff]'}`}>{count(k)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Match list ---------- */}
        <div className="mt-8 sm:mt-10">
          {loading && <Skeleton />}

          {!loading && shown.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#cfdcf7] bg-white/70 px-6 py-14 text-center">
              <p className="text-lg font-bold text-[#0a1f5c]">No matches found</p>
              <p className="text-[#475569] mt-1">Try another tournament or status.</p>
              {(tid || st !== 'all') && (
                <button onClick={() => { setTid(''); setSt('all'); }}
                  className={`mt-5 px-5 py-2.5 rounded-xl ${primaryBtn} ${focusRing}`}>Clear filters</button>
              )}
            </div>
          )}

          {liveNow.length > 0 && (
            <section className="mb-8 sm:mb-10">
              <h2 className="flex items-center gap-2 font-['Barlow_Condensed'] text-2xl sm:text-3xl font-bold text-[#0a1f5c] mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] shadow-[0_0_10px_#e11d48] animate-pulse" />Live now
              </h2>
              <div className="space-y-4">{liveNow.map((m) => <MatchCard key={m._id} m={m} />)}</div>
            </section>
          )}

          {groups.map((g) => (
            <section key={g.k} className="mb-8 sm:mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1.5 h-7 rounded-full bg-[#1f5eff] shadow-[0_0_10px_#1f5eff] shrink-0" />
                <h2 className="font-['Barlow_Condensed'] text-2xl sm:text-3xl font-bold leading-none text-[#0a1f5c]">{dayLabel(g.k, g.date)}</h2>
                {g.k === today && <span className="text-[13px] font-bold px-2.5 py-1 rounded-full bg-[#1f5eff] text-white">Today</span>}
                <span className="ml-auto text-sm text-[#475569] shrink-0">{g.items.length} {g.items.length === 1 ? 'match' : 'matches'}</span>
              </div>
              <div className="space-y-4">{g.items.map((m) => <MatchCard key={m._id} m={m} />)}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}