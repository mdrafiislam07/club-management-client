import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FAPI, { usePolling, fmtDate } from './footballApi';
import StandingsTable, { formatLabel } from './StandingsTable';
import {
  PageShell, HeroFrame, Eyebrow, SectionHead, Rv, Marquee, CountUp, Empty, Logo, LiveChip, STATUS_LABEL
} from './FootballTheme';

const ICONS = {
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  teams: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  tag: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01'
};
const Icon = ({ name, className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);

const MiniPitch = () => (
  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 160" aria-hidden="true">
    <g fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="2">
      <rect x="10" y="10" width="380" height="140" /><line x1="200" y1="10" x2="200" y2="150" /><circle cx="200" cy="80" r="26" />
      <rect x="10" y="45" width="52" height="70" /><rect x="338" y="45" width="52" height="70" />
    </g>
  </svg>
);

const stClass = (s) => (s === 'ongoing' ? 'st-ongoing' : s === 'upcoming' ? 'st-upcoming' : 'st-completed');
const byDate = (a, b) => new Date(a.date) - new Date(b.date);

const StatusPill = ({ m }) => {
  if (m.status === 'live') return <LiveChip minute={m.minute} />;
  if (m.status === 'completed') return <span className="st st-completed">Full time</span>;
  return <span className="st st-upcoming">Upcoming</span>;
};

/* compact scoreboard card (marquee / grid, same as main Home's MatchCard) */
const MatchTile = ({ m, fixed }) => (
  <Link to="/sports/football/schedule" className={`mc block rounded-2xl p-4 text-[var(--ink)] ${fixed ? 'w-[280px] sm:w-[320px]' : 'w-full'}`}>
    <div className="flex items-center justify-between gap-3 mb-3">
      <span className="text-xs font-semibold b-mute truncate min-w-0">{m.tournament?.name}{m.round && ` · ${m.round}`}</span>
      <StatusPill m={m} />
    </div>
    {[[m.teamA, m.scoreA], [m.teamB, m.scoreB]].map(([t, sc], k) => (
      <div key={k} className="flex items-center justify-between gap-3 py-1.5">
        <span className="flex items-center gap-2.5 min-w-0">
          <Logo t={t} size="w-7 h-7" />
          <span className="fd text-xl font-semibold truncate">{t?.shortName || t?.name}</span>
        </span>
        {m.status !== 'upcoming' && (
          <span key={sc} className={`text-sm font-bold tabular-nums shrink-0 ${m.status === 'live' ? 'score-pop' : ''}`}>{sc}</span>
        )}
      </div>
    ))}
    <p className="text-xs mt-2 truncate b-mute font-medium">
      {fmtDate(m.date)}{m.time && ` · ${m.time}`}{m.venue && ` · ${m.venue}`}
    </p>
  </Link>
);

export default function FootballHome() {
  const [d, setD] = useState({ matches: [], tournaments: [], teams: [], players: [], table: [] });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState(null);

  usePolling(async () => {
    try {
      const [m, t, tm, p] = await Promise.all([FAPI.get('/matches'), FAPI.get('/tournaments'), FAPI.get('/teams'), FAPI.get('/auction')]);
      const active = t.data.find((x) => x.status === 'ongoing') || t.data[0];
      const table = active ? (await FAPI.get(`/points/table/${active._id}`)).data : [];
      setD({ matches: m.data, tournaments: t.data, teams: tm.data, players: p.data, table, active });
      setLoaded(true);
    } catch (e) { /* silent: next poll retries */ }
  }, 8000);

  const live = d.matches.filter((m) => m.status === 'live');
  const upcoming = d.matches.filter((m) => m.status === 'upcoming').sort(byDate).slice(0, 6);
  const results = d.matches.filter((m) => m.status === 'completed').sort((a, b) => byDate(b, a)).slice(0, 6);
  const hero = live[0] || upcoming[0];
  const livePlayer = d.players.find((p) => p.status === 'live');
  const sold = d.players.filter((p) => p.status === 'sold');
  const active = d.active;

  const tabs = [['live', 'Live', live], ['upcoming', 'Upcoming', upcoming], ['results', 'Results', results]];
  const current = tab || (live.length ? 'live' : upcoming.length ? 'upcoming' : 'results');
  const shown = tabs.find(([k]) => k === current)[2];
  const emptyText = { live: 'No match is live right now.', upcoming: 'No upcoming matches. New fixtures appear here once they are scheduled.', results: 'No results yet. Finished matches appear here.' }[current];

  const stats = [
    ['Tournaments', d.tournaments.length, '/sports/football/tournament', 'trophy'],
    ['Teams', d.teams.length, '/sports/football/team', 'teams'],
    ['Matches', d.matches.length, '/sports/football/schedule', 'calendar'],
    ['Players sold', sold.length, '/sports/football/auction', 'tag']
  ];

  return (
    <PageShell>
      {/* ---------- HERO ---------- */}
      <HeroFrame className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] gap-10 items-end lg:pt-20">
        <div className="min-w-0">
          {live.length > 0 && (
            <button onClick={() => { setTab('live'); document.getElementById('fixtures')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="rise inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur px-4 py-2 text-sm font-semibold mb-6">
              <LiveChip /> {live.length} match{live.length > 1 ? 'es' : ''} in play
            </button>
          )}
          <Eyebrow />
          <h1 className="rise fd font-bold leading-[.95] text-[clamp(3.25rem,10vw,7rem)]" style={{ animationDelay: '.08s' }}>BRIU Football</h1>
          <p className="rise text-white/75 text-base sm:text-lg max-w-md leading-relaxed mt-5" style={{ animationDelay: '.16s' }}>
            Fixtures, live scores, standings and squads from every football tournament on campus.
          </p>
          <div className="rise mt-8 flex flex-col sm:flex-row gap-3" style={{ animationDelay: '.24s' }}>
            <Link to="/sports/football/schedule" className="btn-gold">See full schedule</Link>
            <Link to="/sports/football/point-table" className="btn-ghost">Open point table</Link>
          </div>
        </div>

        <div className="rise min-w-0" style={{ animationDelay: '.3s' }}>
          {hero ? (
            <div className={`fbp p-5 sm:p-7 text-[var(--ink)] shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)] ${hero.status === 'live' ? 'is-live' : ''}`}>
              <div className="flex justify-center mb-5">
                {hero.status === 'live'
                  ? <LiveChip minute={hero.minute} />
                  : <span className="st st-upcoming">Next match · {fmtDate(hero.date)}{hero.time && ` · ${hero.time}`}</span>}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-5">
                {[hero.teamA, hero.teamB].map((t, i) => (
                  <div key={i} className={`flex flex-col items-center gap-3 min-w-0 ${i === 1 ? 'order-3' : ''}`}>
                    <Logo t={t} size="w-16 h-16 sm:w-20 sm:h-20" />
                    <b className="fd text-lg sm:text-2xl leading-tight line-clamp-2 break-words w-full text-center">{t?.name}</b>
                  </div>
                ))}
                <div className="order-2 fd text-5xl sm:text-7xl font-bold whitespace-nowrap text-[var(--fill)]">
                  {hero.status === 'upcoming' ? 'vs' : <span key={`${hero.scoreA}-${hero.scoreB}`} className={hero.status === 'live' ? 'score-pop' : undefined}>{hero.scoreA} - {hero.scoreB}</span>}
                </div>
              </div>
              <p className="text-sm b-mute mt-5 pt-4 border-t b-line truncate text-center">
                {hero.tournament?.name}{hero.round && ` · ${hero.round}`}{hero.venue && ` · ${hero.venue}`}
              </p>
            </div>
          ) : (
            <p className="text-white/70 lg:text-right">Fixtures will appear here once the schedule is published.</p>
          )}
        </div>
      </HeroFrame>

      {/* ---------- STATS (hero er upor overlap) ---------- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-14 sm:-mt-16 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {stats.map(([label, value, to, icon], i) => (
            <Rv key={label} i={i} v="z">
              <Link to={to} className="nudge fbp lift block p-4 sm:p-6 h-full shadow-[0_18px_40px_-26px_rgba(22,101,52,.45)]">
                <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl grid place-items-center mb-3 sm:mb-4 bg-[var(--fill)] text-white"><Icon name={icon} /></span>
                <b className="block fd text-5xl sm:text-6xl leading-none text-[var(--ink)] tabular-nums"><CountUp value={value} loading={!loaded} /></b>
                <span className="flex items-center justify-between text-sm sm:text-base b-mute mt-1.5">{label}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 nudge-i b-acc" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </Link>
            </Rv>
          ))}
        </div>
      </div>

      {/* ---------- FIXTURES ---------- */}
      <section id="fixtures" className="band band-w">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead title="Fixtures and results" sub="Live scores, upcoming matches and latest results. Hover or touch to pause." to="/sports/football/schedule" cta="Full schedule" />
          <Rv className="no-scrollbar flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-8" role="tablist">
            {tabs.map(([k, label, list]) => (
              <button key={k} role="tab" aria-selected={current === k} onClick={() => setTab(k)}
                className="chip shrink-0 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full text-sm font-semibold border b-surf b-line text-[var(--ink)] cursor-pointer">
                {k === 'live' && list.length > 0 && <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse motion-reduce:animate-none" />}
                {label}<span className="text-[13px] opacity-70 tabular-nums">{list.length}</span>
              </button>
            ))}
          </Rv>
        </div>
        {shown.length >= 3 ? (
          <Marquee key={current} items={shown} speed={36} reverse={current === 'results'} render={(m) => <MatchTile m={m} fixed />} />
        ) : shown.length > 0 ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((m) => <MatchTile key={m._id} m={m} />)}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6"><Empty text={emptyText} /></div>
        )}
      </section>

      {/* ---------- STANDINGS + SIDE ---------- */}
      <section className="band band-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead title="Standings" sub={active?.name} to="/sports/football/point-table" cta="Full table" />
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 items-start">
            <Rv className="lg:col-span-2 min-w-0">
              <div className="fbp p-3 sm:p-5">
                {d.table.length > 0
                  ? <StandingsTable rows={d.table} format={active?.format} limit={8} bare />
                  : <Empty text="Standings will appear after the first completed match." />}
              </div>
            </Rv>

            <div className="flex flex-col gap-6 sm:gap-8 min-w-0">
              <Rv i={1} v="r">
                <div className="fbp p-5 sm:p-6">
                  <h3 className="fd text-2xl font-bold">Tournament in focus</h3>
                  {active ? (
                    <div className="mt-3">
                      <p className="text-lg font-bold leading-snug">{active.name}</p>
                      <span className={`st ${stClass(active.status)} inline-block mt-2`}>{STATUS_LABEL[active.status] || active.status}</span>
                      <p className="text-sm b-mute mt-3">{formatLabel(active)}</p>
                      <p className="text-sm b-mute mt-1">
                        {fmtDate(active.startDate)}{active.endDate && ` to ${fmtDate(active.endDate)}`}{active.venue && ` · ${active.venue}`}
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <Link to="/sports/football/schedule" className="btn-fill !min-h-[44px] !px-3 text-sm">Fixtures</Link>
                        <Link to="/sports/football/point-table" className="btn-line !min-h-[44px] !px-3 text-sm">Standings</Link>
                      </div>
                    </div>
                  ) : <p className="b-mute mt-3">No tournament yet.</p>}
                </div>
              </Rv>

              <Rv i={2} v="r">
                <div className={`fbp p-5 sm:p-6 ${livePlayer ? 'is-live' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="fd text-2xl font-bold">Player auction</h3>
                    <Link to="/sports/football/auction" className="text-sm font-semibold b-acc hover:underline">Open</Link>
                  </div>
                  {livePlayer ? (
                    <div className="mt-3">
                      <LiveChip />
                      <p className="text-lg font-bold mt-3">{livePlayer.name} <span className="font-medium b-mute">({livePlayer.position})</span></p>
                      <p className="text-sm b-mute mt-1">
                        Current bid <b className="b-acc">{livePlayer.currentBid}</b>{livePlayer.currentTeam && ` by ${livePlayer.currentTeam.name}`}
                      </p>
                    </div>
                  ) : (
                    <p className="b-mute mt-3">No player on the block right now. <b className="b-acc">{sold.length}</b> players sold so far.</p>
                  )}
                </div>
              </Rv>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TOURNAMENTS ---------- */}
      <section className="band band-w">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead title="Tournaments" sub="Browse every competition." to="/sports/football/tournament" cta="All tournaments" />
          {d.tournaments.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {d.tournaments.slice(0, 3).map((t, i) => (
                <Rv key={t._id} i={i} v="z" className="min-w-0">
                  <Link to="/sports/football/tournament" className="fbp lift block h-full overflow-hidden">
                    <div className="relative h-40 sm:h-44 overflow-hidden grass-mini grid place-items-center text-white/80">
                      {t.banner
                        ? <img src={t.banner} alt="" loading="lazy" className="lift-img absolute inset-0 h-full w-full object-cover" />
                        : <><MiniPitch /><Icon name="trophy" className="relative w-12 h-12 text-white" /></>}
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <b className="fd text-2xl leading-tight">{t.name}</b>
                        <span className={`st ${stClass(t.status)} shrink-0`}>{STATUS_LABEL[t.status] || t.status}</span>
                      </div>
                      <p className="text-sm b-mute mt-2 capitalize">{t.category}</p>
                      <p className="text-sm b-mute">{formatLabel(t)}</p>
                    </div>
                  </Link>
                </Rv>
              ))}
            </div>
          ) : <Empty text="No tournament has been added yet." />}
        </div>
      </section>

      {/* ---------- TEAMS (marquee) ---------- */}
      <section className="band band-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHead title="Teams" sub={`${d.teams.length} registered. Drag or scroll to browse.`} to="/sports/football/team" cta="All teams" />
        </div>
        {d.teams.length > 0 ? (
          <Marquee items={d.teams.slice(0, 16)} speed={26} boost={0.5} gap={12} render={(t) => (
            <Link to="/sports/football/team" className="pc flex flex-col items-center gap-2.5 text-center rounded-2xl px-3 py-4 w-[140px] sm:w-[176px] h-full">
              <Logo t={t} size="w-16 h-16 sm:w-20 sm:h-20" />
              <span className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 break-words w-full text-[var(--ink)]">{t.name}</span>
            </Link>
          )} />
        ) : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6"><Empty text="No team has been registered yet." /></div>
        )}
      </section>
    </PageShell>
  );
}