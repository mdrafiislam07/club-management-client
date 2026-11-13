import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FAPI, { usePolling, fmtDate } from './footballApi';
import { formatLabel } from './StandingsTable';
import { PageShell, PageHero, Rv, Empty, Skeleton, STATUS_LABEL } from './FootballTheme';

const PAGE = 6; // cards shown per "Show more" step
const DAY = 864e5;
const TABS = [['all', 'All'], ['inter', 'Inter department'], ['central', 'Central'], ['franchise', 'Franchise']];
const ORDER = { ongoing: 0, upcoming: 1, completed: 2 };

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
  <svg viewBox="0 0 24 24" className="w-4 h-4 nudge-i" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

const Pitch = () => (
  <svg className="absolute inset-0 w-full h-full text-white opacity-[0.45]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 160" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="2"><rect x="10" y="10" width="380" height="140" /><line x1="200" y1="10" x2="200" y2="150" /><circle cx="200" cy="80" r="26" /><rect x="10" y="45" width="52" height="70" /><rect x="338" y="45" width="52" height="70" /></g>
  </svg>
);

/* ---------- shared pieces ---------- */
function Banner({ t, className = '' }) {
  const cat = (TABS.find(([k]) => k === t.category) || [])[1];
  return (
    <div className={`relative overflow-hidden grass-mini ${className}`}>
      {t.banner
        ? <img src={t.banner} alt="" loading="lazy" className="lift-img absolute inset-0 h-full w-full object-cover" />
        : <Pitch />}
      {t.banner && <div className="absolute inset-0 bg-gradient-to-t from-[#052E16]/60 via-transparent to-transparent" />}
      <span className={`absolute top-3 left-3 st ${t.status === 'ongoing' ? 'st-ongoing' : t.status === 'upcoming' ? 'st-upcoming' : ''}`}
        style={t.status === 'completed' ? { background: 'rgba(11,19,37,.82)', color: '#fff' } : undefined}>
        {STATUS_LABEL[t.status] || 'Completed'}
      </span>
      {cat && <span className="absolute bottom-3 left-3 text-[12px] font-semibold text-[var(--ink)] px-2.5 py-1 rounded-full bg-white/95">{cat}</span>}
    </div>
  );
}

function Meta({ t }) {
  const range = `${fmtDate(t.startDate)}${t.endDate ? ` to ${fmtDate(t.endDate)}` : ''}`;
  return (
    <ul className="space-y-1.5 text-sm b-mute">
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
        <div className="h-1.5 rounded-full b-surf2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(p.pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Tournament progress">
          <div className="h-full rounded-full bg-[var(--fill)] transition-[width] duration-1000 ease-out" style={{ width: `${p.pct}%` }} />
        </div>
      )}
      <p className={`text-[13px] font-semibold b-acc ${p.pct != null ? 'mt-2' : ''}`}>{p.label}</p>
    </div>
  );
}

function Actions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link to="/sports/football/schedule" className="nudge btn-fill !min-h-[44px] !px-4 text-sm">Fixtures <Arrow /></Link>
      <Link to="/sports/football/point-table" className="btn-line !min-h-[44px] !px-4 text-sm">Standings</Link>
    </div>
  );
}

const Chip = ({ t }) => (
  <span className="inline-block max-w-full truncate st st-upcoming">{formatLabel(t)}</span>
);

/* ---------- cards ---------- */
function Featured({ t }) {
  return (
    <article className="fbp lift grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] overflow-hidden">
      <Banner t={t} className="h-56 sm:h-72 lg:h-full lg:min-h-[22rem]" />
      <div className="p-6 sm:p-8 flex flex-col min-w-0">
        <Chip t={t} />
        <h2 className="fd text-4xl sm:text-6xl font-bold leading-none mt-3 text-[var(--ink)] break-words">{t.name}</h2>
        <div className="mt-4"><Meta t={t} /></div>
        {t.description && <p className="mt-4 b-mute leading-relaxed line-clamp-4 max-w-prose">{t.description}</p>}
        <Progress t={t} />
        <div className="mt-auto pt-6"><Actions /></div>
      </div>
    </article>
  );
}

function TournamentCard({ t }) {
  return (
    <article className="fbp lift h-full min-w-0 flex flex-col overflow-hidden">
      <Banner t={t} className="h-40" />
      <div className="flex flex-col flex-1 p-5">
        <h2 className="fd text-2xl sm:text-3xl font-bold leading-tight text-[var(--ink)] break-words">{t.name}</h2>
        <div className="mt-2"><Chip t={t} /></div>
        <div className="mt-3"><Meta t={t} /></div>
        {t.description && <p className="text-sm leading-relaxed b-mute mt-3 line-clamp-3">{t.description}</p>}
        <Progress t={t} />
        <div className="mt-auto pt-5"><Actions /></div>
      </div>
    </article>
  );
}

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

  // live tournament ke upore highlight (jodi kono filter na thake)
  const hero = !filtering && filtered[0]?.status === 'ongoing' ? filtered[0] : null;
  const rest = hero ? filtered.slice(1) : filtered;
  const shown = rest.slice(0, limit);
  const left = rest.length - shown.length;

  return (
    <PageShell>
      <PageHero
        title="Tournaments"
        sub={`${list.length > 0 ? `${list.length} ${list.length === 1 ? 'tournament' : 'tournaments'}${live ? `, ${live} live right now. ` : '. '}` : ''}Follow fixtures and standings.`} />

      <main className="fb-main">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <section aria-label="Find a tournament" className="fbp -mt-14 sm:-mt-16 relative z-10 p-4 sm:p-6 shadow-[0_18px_40px_-26px_rgba(22,101,52,.45)]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)]">
              <label className="block min-w-0">
                <span className="block text-sm font-semibold b-mute mb-1.5">Search</span>
                <span className="relative block">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 b-mute pointer-events-none"><SearchIcon /></span>
                  <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search by tournament name" className="fld !pl-11" />
                </span>
              </label>
              <label className="block min-w-0">
                <span className="block text-sm font-semibold b-mute mb-1.5">Status</span>
                <select value={st} onChange={(e) => { setSt(e.target.value); setLimit(PAGE); }} className="fld">
                  <option value="">All statuses</option>
                  <option value="ongoing">Live now</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>

            <div role="tablist" aria-label="Tournament category" className="no-scrollbar mt-4 pt-4 border-t b-line flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              {TABS.map(([k, l]) => (
                <button key={k} role="tab" aria-selected={cat === k} onClick={() => { setCat(k); setLimit(PAGE); }}
                  className="chip shrink-0 min-h-[44px] px-5 inline-flex items-center gap-2 rounded-full text-sm font-semibold border b-surf b-line text-[var(--ink)] cursor-pointer">
                  {l}<span className="text-[13px] opacity-70 tabular-nums">{count(k)}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="mt-10 sm:mt-12" aria-live="polite">
            {loading && <Skeleton n={3} h="h-[26rem]" cols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />}

            {!loading && error && list.length === 0 && (
              <Empty title="Couldn’t load tournaments" text="Check your connection. We’ll try again automatically." />
            )}

            {!loading && !error && filtered.length === 0 && (
              <Empty
                title={list.length === 0 ? 'No tournament yet' : 'No tournament found'}
                text={list.length === 0 ? 'Tournaments will appear here once they are created.' : 'Try a different name, status or category.'}>
                {filtering && <button onClick={reset} className="btn-fill mt-5">Clear filters</button>}
              </Empty>
            )}

            {filtered.length > 0 && (
              <>
                <p className="text-sm b-mute mb-4">
                  Showing <b className="b-acc">{shown.length + (hero ? 1 : 0)}</b> of {filtered.length}
                </p>
                {hero && <Rv className="mb-6"><Featured t={hero} /></Rv>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {shown.map((t, i) => <Rv key={t._id} i={i % 6} v="z" className="min-w-0"><TournamentCard t={t} /></Rv>)}
                </div>
                {left > 0 && (
                  <div className="mt-10 text-center">
                    <button onClick={() => setLimit(limit + PAGE)} className="btn-line">Show more ({left} left)</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}