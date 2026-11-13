import React, { useState } from 'react';
import FAPI, { usePolling } from './footballApi';
import { PageShell, PageHero, Rv, Empty, Skeleton, Logo, LiveChip } from './FootballTheme';

const STATUS = [['all', 'All'], ['live', 'Live'], ['upcoming', 'Upcoming'], ['completed', 'Results']];
const EVENT_ICON = { goal: '⚽', yellow: '🟨', red: '🟥', sub: '🔁' };

const StatusPill = ({ m }) => {
  if (m.status === 'live') return <LiveChip minute={m.minute} />;
  if (m.status === 'completed') return <span className="st st-completed">Full time</span>;
  return <span className="st st-upcoming">Upcoming</span>;
};

// team A left (name, then crest next to score); team B mirrors it. Phone: crest above name.
const Team = ({ t, right }) => (
  <div className={`flex flex-col items-center gap-2 text-center min-w-0 sm:gap-4 ${right ? 'sm:flex-row sm:text-left' : 'sm:flex-row-reverse sm:text-right'}`}>
    <Logo t={t} size="w-12 h-12 sm:w-14 sm:h-14" />
    <span className="fd text-lg sm:text-2xl font-semibold leading-tight line-clamp-2 break-words text-[var(--ink)] min-w-0">{t?.name}</span>
  </div>
);

const MatchCard = ({ m }) => {
  const live = m.status === 'live';
  const footer = [m.time, m.venue].filter(Boolean).join(' · ');
  return (
    <article className={`fbp lift p-4 sm:p-6 ${live ? 'is-live' : ''}`}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-[13px] sm:text-sm b-mute truncate min-w-0">{m.tournament?.name}{m.round && ` · ${m.round}`}</p>
        <StatusPill m={m} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <Team t={m.teamA} />
        <div className="text-center px-1 sm:px-4 min-w-[84px]">
          <b className="block fd text-4xl sm:text-6xl font-bold leading-none text-[var(--ink)] whitespace-nowrap">
            {m.status === 'upcoming'
              ? 'vs'
              : <span key={`${m.scoreA}-${m.scoreB}`} className={live ? 'score-pop' : undefined}>{m.scoreA} - {m.scoreB}</span>}
          </b>
          {m.status === 'upcoming' && m.time && <span className="block mt-1 text-[13px] sm:text-sm font-semibold b-acc">{m.time}</span>}
        </div>
        <Team t={m.teamB} right />
      </div>

      {footer && <p className="mt-5 pt-4 border-t b-line text-[13px] sm:text-sm text-center b-mute truncate">{footer}</p>}

      {m.events?.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {m.events.map((ev, i) => (
            <li key={i} className="inline-flex items-center gap-1.5 rounded-full b-surf2 border b-line px-3 py-1 text-[13px] sm:text-sm text-[var(--ink)]">
              {ev.minute != null && <b className="b-acc">{ev.minute}'</b>}
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
    <PageShell>
      <PageHero title="Schedule and results" sub="Live scores, upcoming fixtures and final results from every tournament." />

      <main className="fb-main">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          {/* filter panel (hero er upor overlap) */}
          <section className="fbp -mt-14 sm:-mt-16 relative z-10 p-4 sm:p-6 shadow-[0_18px_40px_-26px_rgba(22,101,52,.45)]" aria-label="Filters">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-end">
              <label className="block min-w-0">
                <span className="block text-sm font-semibold b-mute mb-1.5">Tournament</span>
                <select value={tid} onChange={(e) => setTid(e.target.value)} aria-label="Tournament" className="fld">
                  <option value="">All tournaments</option>
                  {tours.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </label>

              <div className="min-w-0">
                <span className="block text-sm font-semibold b-mute mb-1.5">Match status</span>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
                  {STATUS.map(([k, label]) => (
                    <button key={k} role="tab" aria-selected={st === k} onClick={() => setSt(k)}
                      className="chip shrink-0 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full text-sm font-semibold border b-surf b-line text-[var(--ink)] cursor-pointer">
                      {k === 'live' && count('live') > 0 && <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse motion-reduce:animate-none" />}
                      {label}
                      <span className="text-[13px] opacity-70 tabular-nums">{count(k)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* match list */}
          <div className="mt-10 sm:mt-12">
            {loading && <Skeleton n={3} h="h-44" />}

            {!loading && shown.length === 0 && (
              <Empty title="No matches found" text="Try another tournament or status.">
                {(tid || st !== 'all') && (
                  <button onClick={() => { setTid(''); setSt('all'); }} className="btn-fill mt-5">Clear filters</button>
                )}
              </Empty>
            )}

            {liveNow.length > 0 && (
              <section className="mb-10 sm:mb-12">
                <Rv><h2 className="flex items-center gap-3 fd text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-5"><LiveChip /> Live now</h2></Rv>
                <div className="space-y-4">{liveNow.map((m, i) => <Rv key={m._id} i={i}><MatchCard m={m} /></Rv>)}</div>
              </section>
            )}

            {groups.map((g) => (
              <section key={g.k} className="mb-10 sm:mb-12">
                <Rv className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-5">
                  <span className="hd-bar w-1.5 h-8 rounded-full shrink-0" />
                  <h2 className="fd text-3xl sm:text-4xl font-bold leading-none text-[var(--ink)]">{dayLabel(g.k, g.date)}</h2>
                  {g.k === today && <span className="st st-ongoing" style={{ background: 'var(--fill)' }}>Today</span>}
                  <span className="ml-auto text-sm b-mute shrink-0">{g.items.length} {g.items.length === 1 ? 'match' : 'matches'}</span>
                </Rv>
                <div className="space-y-4">{g.items.map((m, i) => <Rv key={m._id} i={i % 6}><MatchCard m={m} /></Rv>)}</div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </PageShell>
  );
}