import React, { useState } from 'react';
import FAPI, { usePolling } from './footballApi';
import { PageShell, PageHero, Rv, Empty, Skeleton, Logo } from './FootballTheme';

const PAGE = 12; // teams shown per "Show more" step

const Chevron = ({ open }) => (
  <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
  </svg>
);

const Stat = ({ label, value }) => (
  <div className="min-w-0 px-3 first:pl-0 last:pr-0">
    <dt className="text-[13px] b-mute">{label}</dt>
    <dd className="font-semibold text-[var(--ink)] truncate" title={typeof value === 'string' ? value : undefined}>{value}</dd>
  </div>
);

function TeamCard({ t, open, onToggle }) {
  const players = t.players || [];
  return (
    <article className="fbp lift min-w-0 flex flex-col overflow-hidden">
      {/* banner: dark navy + pitch lines */}
      <div className="relative h-20 overflow-hidden grass-mini">
        <svg className="absolute inset-0 w-full h-full text-white opacity-[0.35]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 80" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="2"><circle cx="330" cy="40" r="34" /><line x1="330" y1="0" x2="330" y2="80" /><rect x="-20" y="14" width="70" height="52" /></g>
        </svg>
      </div>

      <div className="px-5 pb-5 flex flex-col flex-1">
        <div className="-mt-10 relative z-10"><Logo t={t} size="w-20 h-20 !border-4 !border-white shadow-md" /></div>

        <div className="mt-3 min-w-0">
          <h2 className="fd text-2xl sm:text-3xl font-bold leading-tight text-[var(--ink)] break-words">{t.name}</h2>
          {t.tournament?.name && <span className="st st-upcoming inline-block max-w-full truncate mt-2">{t.tournament.name}</span>}
        </div>

        <dl className="grid grid-cols-3 divide-x divide-[var(--line)] text-sm mt-5 pt-4 border-t b-line">
          <Stat label="Captain" value={t.captain || '-'} />
          <Stat label="Coach" value={t.coach || '-'} />
          <Stat label="Players" value={players.length} />
        </dl>

        <div className="pt-5">
          {players.length > 0 ? (
            <>
              <button onClick={onToggle} aria-expanded={open}
                className={`chip w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold border b-line cursor-pointer ${open ? '' : 'b-surf text-[var(--ink)]'}`}
                aria-selected={open}>
                {open ? 'Hide squad' : `View squad (${players.length})`}<Chevron open={open} />
              </button>
              {/* smooth open/close */}
              <div className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <ul className="mt-3 rounded-xl border b-line divide-y divide-[var(--line)] overflow-hidden">
                    {players.map((p, i) => (
                      <li key={i} className="flex items-center gap-3 px-3 py-2.5 b-surf">
                        <span className="fd w-8 h-8 shrink-0 rounded-lg grid place-items-center text-lg font-bold bg-[var(--fill)] text-white">{p.jerseyNo || '–'}</span>
                        <span className="flex-1 min-w-0 truncate font-medium text-[var(--ink)]">{p.name}</span>
                        {p.position && <span className="shrink-0 text-[13px] font-semibold px-2 py-1 rounded-md b-surf2 b-mute">{p.position}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-center b-mute rounded-xl b-surf2 py-3">Squad not published yet</p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function FootballTeam() {
  const [teams, setTeams] = useState([]);
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const [tid, setTid] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);

  usePolling(() => FAPI.get('/teams').then((r) => setTeams(r.data)).catch(() => {}).finally(() => setLoading(false)), 20000);

  const tournaments = [];
  teams.forEach((t) => { if (t.tournament?._id && !tournaments.some((x) => x._id === t.tournament._id)) tournaments.push(t.tournament); });

  const term = q.trim().toLowerCase();
  const filtered = teams.filter((t) =>
    (!tid || t.tournament?._id === tid) &&
    (!term || t.name?.toLowerCase().includes(term) || t.shortName?.toLowerCase().includes(term)));
  const shown = filtered.slice(0, limit);
  const left = filtered.length - shown.length;
  const clear = () => { setQ(''); setTid(''); setLimit(PAGE); };

  return (
    <PageShell>
      <PageHero
        title="Teams"
        sub={`${teams.length > 0 ? `${teams.length} registered ${teams.length === 1 ? 'team' : 'teams'}. ` : ''}Meet the squads, captains and coaches.`} />

      <main className="fb-main">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <section className="fbp -mt-14 sm:-mt-16 relative z-10 p-4 sm:p-6 shadow-[0_18px_40px_-26px_rgba(22,101,52,.45)]" aria-label="Find a team">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
              <label className="block min-w-0">
                <span className="block text-sm font-semibold b-mute mb-1.5">Search</span>
                <span className="relative block">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 b-mute pointer-events-none"><SearchIcon /></span>
                  <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search by team name" className="fld !pl-11" />
                </span>
              </label>
              <label className="block min-w-0">
                <span className="block text-sm font-semibold b-mute mb-1.5">Tournament</span>
                <select value={tid} onChange={(e) => { setTid(e.target.value); setLimit(PAGE); }} aria-label="Tournament" className="fld">
                  <option value="">All tournaments</option>
                  {tournaments.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </label>
            </div>
          </section>

          <div className="mt-10 sm:mt-12">
            {loading && <Skeleton n={3} h="h-72" cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />}

            {!loading && filtered.length === 0 && (
              <Empty title={teams.length === 0 ? 'No team registered yet' : 'No team found'}
                text={teams.length === 0 ? 'Teams will appear here once they are added.' : 'Try a different name or tournament.'}>
                {(q || tid) && <button onClick={clear} className="btn-fill mt-5">Clear filters</button>}
              </Empty>
            )}

            {filtered.length > 0 && (
              <>
                <p className="text-sm b-mute mb-4">Showing <b className="b-acc">{shown.length}</b> of {filtered.length}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
                  {shown.map((t, i) => (
                    <Rv key={t._id} i={i % 6} v="z">
                      <TeamCard t={t} open={open === t._id} onToggle={() => setOpen(open === t._id ? null : t._id)} />
                    </Rv>
                  ))}
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