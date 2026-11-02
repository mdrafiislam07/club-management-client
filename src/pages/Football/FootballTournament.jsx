import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FAPI, { usePolling, fmtDate } from './footballApi';
import { formatLabel } from './StandingsTable';

/* Palette (same as the Cricket home)
   bg #eaf2ff→#f6f9ff · ink #0a1f5c · soft #475569 · line #c7d7f5
   blue #1f5eff · sky #0ea5e9 · indigo #4f46e5 · live #e11d48 · button text white
   Each tournament card gets its own --accent (cyan / violet / gold). */

const GOLD = '#1f5eff';
const CYAN = '#0369a1';
const VIOLET = '#4f46e5';
const ACCENTS = [CYAN, VIOLET, GOLD];

const PAGE = 6; // cards shown per "Show more" step
const DAY = 864e5;
const TABS = [['all', 'All'], ['inter', 'Inter department'], ['central', 'Central'], ['franchise', 'Franchise']];
const ORDER = { ongoing: 0, upcoming: 1, completed: 2 };
// status badges sit on top of banner images, so they keep a solid / dark backing
const STATUS = {
  ongoing: { label: 'Live now', cls: 'bg-[#e11d48] text-white shadow-[0_0_22px_-4px_#e11d48]', dot: 'bg-white animate-pulse motion-reduce:animate-none' },
  upcoming: { label: 'Upcoming', cls: 'bg-white/90 text-[#1f5eff] border border-[#1f5eff]/40 backdrop-blur', dot: 'bg-[#1f5eff]' },
  completed: { label: 'Completed', cls: 'bg-[#0a1f5c]/80 text-white backdrop-blur', dot: 'bg-slate-300' },
};

const tint = (pct) => `color-mix(in srgb, var(--accent, ${GOLD}) ${pct}%, transparent)`;
const glass = 'bg-gradient-to-b from-white to-[#f4f8ff] border border-[#c7d7f5]';
const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5eff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f8ff]';
const primaryBtn = 'bg-[linear-gradient(100deg,#1f5eff,#2563eb_50%,#0369a1)] text-white font-bold shadow-[0_12px_40px_-10px_rgba(31,94,255,0.55)] hover:brightness-105 transition';
const cardShell = `${glass} rounded-2xl overflow-hidden shadow-[0_14px_36px_-20px_rgba(10,31,92,0.4)]`;

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

/* ---------- helpers ---------- */
function timing(t) {
  const s = t.startDate ? new Date(t.startDate) : null;
  const e = t.endDate ? new Date(t.endDate) : null;
  const now = Date.now();
  if (t.status === 'ongoing' && s && e && !isNaN(s) && !isNaN(e)) {
    const total = Math.max(1, Math.ceil((e - s) / DAY) + 1);
    const day = Math.min(total, Math.max(1, Math.floor((now - s) / DAY) + 1));
    return { pct: (day / total) * 100, label: `Day ${day} of ${total}` };
  }
  if (t.status === 'upcoming' && s && !isNaN(s)) {
    const d = Math.ceil((s - now) / DAY);
    return { label: d <= 0 ? 'Starts today' : `Starts in ${d} ${d === 1 ? 'day' : 'days'}` };
  }
  return null;
}

/* ---------- icons ---------- */
const Icon = ({ d, extra }) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} />{extra}</svg>
);
const CalIcon = () => <Icon d="M4 7a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2zM4 10h16M8 3v4M16 3v4" />;
const PinIcon = () => <Icon d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" extra={<circle cx="12" cy="10" r="2.5" />} />;
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

const Pitch = ({ id }) => (
  <svg className="absolute inset-0 w-full h-full text-[#1f5eff] opacity-[0.14]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 160" aria-hidden="true" data-k={id}>
    <g fill="none" stroke="currentColor" strokeWidth="2"><rect x="10" y="10" width="380" height="140" /><line x1="200" y1="10" x2="200" y2="150" /><circle cx="200" cy="80" r="26" /><rect x="10" y="45" width="52" height="70" /><rect x="338" y="45" width="52" height="70" /></g>
  </svg>
);

/* ---------- shared pieces ---------- */
function Banner({ t, className = '' }) {
  const s = STATUS[t.status] || STATUS.completed;
  const cat = (TABS.find(([k]) => k === t.category) || [])[1];
  return (
    <div className={`relative overflow-hidden ${className}`}
      style={{ background: `radial-gradient(circle at 30% 20%, ${tint(45)}, #eaf1ff 75%)` }}>
      {t.banner
        ? <img src={t.banner} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        : <Pitch id={t._id} />}
      {t.banner && <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f5c]/60 via-transparent to-transparent" />}
      <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[13px] font-bold pl-2 pr-3 py-1.5 rounded-full ${s.cls}`}>
        <span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label}
      </span>
      {cat && <span className="absolute bottom-3 left-3 text-[13px] font-semibold text-[#0a1f5c] px-2.5 py-1 rounded-full bg-white/90 border border-[#c7d7f5] backdrop-blur">{cat}</span>}
    </div>
  );
}

function Meta({ t }) {
  const range = `${fmtDate(t.startDate)}${t.endDate ? ` to ${fmtDate(t.endDate)}` : ''}`;
  return (
    <ul className="space-y-1.5 text-sm text-[#475569]">
      <li className="flex items-center gap-2"><CalIcon /><span>{range}</span></li>
      {t.venue && <li className="flex items-center gap-2 min-w-0"><PinIcon /><span className="truncate">{t.venue}</span></li>}
    </ul>
  );
}

function Progress({ t }) {
  const p = timing(t);
  if (!p) return null;
  return (
    <div className="mt-4">
      {p.pct != null && (
        <div className="h-1.5 rounded-full bg-[#e8f0ff] overflow-hidden" role="progressbar" aria-valuenow={Math.round(p.pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Tournament progress">
          <div className="h-full rounded-full bg-gradient-to-r from-[#1f5eff] to-[#0ea5e9] shadow-[0_0_10px_#0ea5e9]" style={{ width: `${p.pct}%` }} />
        </div>
      )}
      <p className={`text-[13px] font-semibold ${p.pct != null ? 'mt-2' : ''}`} style={{ color: 'var(--accent)' }}>{p.label}</p>
    </div>
  );
}

function Actions({ big }) {
  const h = big ? 'h-12' : 'h-11';
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link to="/sports/football/schedule" className={`group ${h} inline-flex items-center justify-center gap-2 rounded-xl text-sm ${primaryBtn} ${focusRing}`}>Fixtures <Arrow /></Link>
      <Link to="/sports/football/point-table"
        style={{ color: 'var(--accent)', background: tint(10), border: `1px solid ${tint(40)}` }}
        className={`${h} inline-flex items-center justify-center rounded-xl text-sm font-bold hover:brightness-95 transition ${focusRing}`}>Standings</Link>
    </div>
  );
}

const Chip = ({ t }) => (
  <span className="inline-block max-w-full truncate text-[13px] font-bold px-2.5 py-1 rounded-full"
    style={{ color: 'var(--accent)', background: tint(14), border: `1px solid ${tint(35)}` }}>{formatLabel(t)}</span>
);

/* ---------- cards ---------- */
function Featured({ t }) {
  return (
    <article style={{ '--accent': GOLD }}
      className={`group grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] ${cardShell} hover:border-[var(--accent)] hover:shadow-[0_26px_60px_-22px_var(--accent)] transition`}>
      <Banner t={t} className="h-56 sm:h-72 lg:h-full lg:min-h-[22rem]" />
      <div className="p-6 sm:p-8 flex flex-col min-w-0">
        <Chip t={t} />
        <h2 className="font-['Barlow_Condensed'] text-4xl sm:text-5xl font-bold leading-none mt-3 text-[#0a1f5c] break-words">{t.name}</h2>
        <div className="mt-4"><Meta t={t} /></div>
        {t.description && <p className="mt-4 text-[#475569] leading-relaxed line-clamp-4 max-w-prose">{t.description}</p>}
        <Progress t={t} />
        <div className="mt-auto pt-6"><Actions big /></div>
      </div>
    </article>
  );
}

function TournamentCard({ t, accent }) {
  return (
    <article style={{ '--accent': accent }}
      className={`group min-w-0 flex flex-col ${cardShell} hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_26px_60px_-22px_var(--accent)] transition`}>
      <Banner t={t} className="h-40" />
      <div className="flex flex-col flex-1 p-5">
        <h2 className="font-['Barlow_Condensed'] text-2xl sm:text-3xl font-bold leading-tight text-[#0a1f5c] break-words">{t.name}</h2>
        <div className="mt-2"><Chip t={t} /></div>
        <div className="mt-3"><Meta t={t} /></div>
        {t.description && <p className="text-sm leading-relaxed text-[#475569] mt-3 line-clamp-3">{t.description}</p>}
        <Progress t={t} />
        <div className="mt-auto pt-5"><Actions /></div>
      </div>
    </article>
  );
}

const Skeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden="true">
    {[0, 1, 2].map((i) => <div key={i} className={`h-[26rem] rounded-2xl ${glass} animate-pulse motion-reduce:animate-none`} />)}
  </div>
);

const Empty = ({ title, text, action }) => (
  <div className="rounded-2xl border border-dashed border-[#cfdcf7] bg-white/70 px-6 py-14 text-center">
    <p className="text-lg font-bold text-[#0a1f5c]">{title}</p>
    <p className="text-[#475569] mt-1">{text}</p>
    {action}
  </div>
);

/* ---------- page ---------- */
export default function FootballTournament() {
  const [list, setList] = useState([]);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  usePolling(() => FAPI.get('/tournaments')
    .then((r) => { setList(r.data); setError(false); })
    .catch(() => setError(true))
    .finally(() => setLoading(false)), 15000);

  const term = q.trim().toLowerCase();
  const filtered = list
    .filter((t) => (cat === 'all' || t.category === cat) && (!st || t.status === st) && (!term || t.name?.toLowerCase().includes(term)))
    .sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3));

  const count = (k) => (k === 'all' ? list.length : list.filter((t) => t.category === k).length);
  const live = list.filter((t) => t.status === 'ongoing').length;
  const filtering = !!(q || st || cat !== 'all');
  const reset = () => { setQ(''); setSt(''); setCat('all'); setLimit(PAGE); };

  // highlight a live tournament on top when nothing is filtered
  const hero = !filtering && filtered[0]?.status === 'ongoing' ? filtered[0] : null;
  const rest = hero ? filtered.slice(1) : filtered;
  const shown = rest.slice(0, limit);
  const left = rest.length - shown.length;

  return (
    /* "dark" class keeps any child component's dark: styles on (class-based dark mode) */
    <div className="[color-scheme:light] relative isolate bg-[linear-gradient(160deg,#dce8ff,#eef3ff_40%,#e3e8ff)] text-[#0a1f5c] min-h-screen overflow-x-hidden" style={{ '--accent': GOLD }}>
      <Ambient />

      {/* ---------- Page header ---------- */}
      <div className="relative overflow-hidden border-b border-[#c7d7f5]">
        <svg className="absolute inset-0 w-full h-full text-[#1f5eff] opacity-[0.07]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="3"><rect x="20" y="20" width="760" height="260" /><line x1="400" y1="20" x2="400" y2="280" /><circle cx="400" cy="150" r="55" /><rect x="20" y="85" width="110" height="130" /><rect x="670" y="85" width="110" height="130" /></g>
        </svg>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-24 sm:pb-28">
          <h1 className="font-['Barlow_Condensed'] text-5xl sm:text-6xl md:text-7xl font-bold leading-none text-[#0a1f5c]">Tournaments</h1>
          <p className="mt-3 text-base sm:text-lg text-[#475569] max-w-xl">
            {list.length > 0 ? `${list.length} ${list.length === 1 ? 'tournament' : 'tournaments'}${live ? `, ${live} live right now. ` : '. '}` : ''}
            Follow fixtures and standings.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        {/* ---------- Filter panel (overlaps header) ---------- */}
        <section aria-label="Find a tournament" className={`-mt-14 sm:-mt-16 relative z-10 ${glass} rounded-2xl p-4 sm:p-6 shadow-[0_14px_36px_-20px_rgba(10,31,92,0.4)]`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)]">
            <label className="block min-w-0">
              <span className="block text-sm font-semibold text-[#475569] mb-1.5">Search</span>
              <span className="relative block">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none"><SearchIcon /></span>
                <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search by tournament name"
                  className={`block w-full min-w-0 h-12 pl-11 pr-3 rounded-xl border border-[#cfdcf7] bg-white/70 text-[#0a1f5c] placeholder:text-[#475569] ${focusRing}`} />
              </span>
            </label>
            <label className="block min-w-0">
              <span className="block text-sm font-semibold text-[#475569] mb-1.5">Status</span>
              <select value={st} onChange={(e) => { setSt(e.target.value); setLimit(PAGE); }}
                className={`block w-full max-w-full min-w-0 h-12 px-3 rounded-xl border border-[#cfdcf7] bg-white/70 text-[#0a1f5c] font-semibold [color-scheme:light] ${focusRing}`}>
                <option value="">All statuses</option>
                <option value="ongoing">Live now</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          <div role="tablist" aria-label="Tournament category" className="mt-4 pt-4 border-t border-[#c7d7f5] flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {TABS.map(([k, l]) => {
              const on = cat === k;
              return (
                <button key={k} role="tab" aria-selected={on} onClick={() => { setCat(k); setLimit(PAGE); }}
                  className={`shrink-0 h-10 px-4 inline-flex items-center gap-2 rounded-full text-sm font-bold border transition-colors ${focusRing} ${
                    on ? 'bg-[#1f5eff] border-[#1f5eff] text-white shadow-[0_10px_30px_-8px_#1f5eff]'
                       : 'bg-transparent border-[#cfdcf7] text-[#475569] hover:bg-[#e8f0ff] hover:text-[#0a1f5c]'}`}>
                  {l}
                  <span className={`text-[13px] px-1.5 rounded-md ${on ? 'bg-white/25' : 'bg-[#e8f0ff] text-[#1f5eff]'}`}>{count(k)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ---------- Content ---------- */}
        <div className="mt-8 sm:mt-10" aria-live="polite">
          {loading && <Skeleton />}

          {!loading && error && list.length === 0 && (
            <Empty title="Couldn’t load tournaments" text="Check your connection. We’ll try again automatically." />
          )}

          {!loading && !error && filtered.length === 0 && (
            <Empty
              title={list.length === 0 ? 'No tournament yet' : 'No tournament found'}
              text={list.length === 0 ? 'Tournaments will appear here once they are created.' : 'Try a different name, status or category.'}
              action={filtering && <button onClick={reset} className={`mt-5 px-5 py-2.5 rounded-xl ${primaryBtn} ${focusRing}`}>Clear filters</button>} />
          )}

          {filtered.length > 0 && (
            <>
              <p className="text-sm text-[#475569] mb-4">
                Showing <b className="text-[#1f5eff]">{shown.length + (hero ? 1 : 0)}</b> of {filtered.length}
              </p>
              {hero && <div className="mb-6"><Featured t={hero} /></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {shown.map((t, i) => <TournamentCard key={t._id} t={t} accent={ACCENTS[i % ACCENTS.length]} />)}
              </div>
              {left > 0 && (
                <div className="mt-8 text-center">
                  <button onClick={() => setLimit(limit + PAGE)}
                    className={`px-6 h-12 rounded-xl border border-[#bcd0f5] bg-white/70 text-[#0a1f5c] font-bold hover:bg-[#e8f0ff] hover:border-[#1f5eff]/50 transition-colors ${focusRing}`}>
                    Show more ({left} left)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}