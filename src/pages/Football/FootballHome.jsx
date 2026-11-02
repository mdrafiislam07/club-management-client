import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FAPI, { usePolling, fmtDate } from './footballApi';
import StandingsTable, { formatLabel } from './StandingsTable';

/* Palette (same as the Cricket home)
   bg #eaf2ff→#f6f9ff · ink #0a1f5c · soft #475569 · line #c7d7f5
   blue #1f5eff · sky #0ea5e9 · indigo #4f46e5 · live #e11d48 · button text white
   Each section sets its own --accent, so bars, pills, links and icons follow it. */

const GOLD = '#1f5eff';
const CYAN = '#0369a1';
const VIOLET = '#4f46e5';
const LIVE = '#e11d48';

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

// accent-based tints (work with whatever --accent is set on a parent)
const tint = (pct) => `color-mix(in srgb, var(--accent, ${GOLD}) ${pct}%, transparent)`;

// shared surface: glass card on the dark page
const glass = 'bg-gradient-to-b from-white to-[#f4f8ff] border border-[#c7d7f5]';

const Logo = ({ t, size = 'w-12 h-12' }) => t?.logo
  ? <img src={t.logo} alt="" className={`${size} rounded-full object-cover bg-white ring-1 ring-[#c7d7f5] shrink-0`} />
  : <span className={`${size} rounded-full bg-[#1f5eff] text-white grid place-items-center text-[13px] font-bold shrink-0`}>{(t?.shortName || t?.name || '?').slice(0, 3)}</span>;

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5eff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f8ff]';

const primaryBtn = 'bg-[linear-gradient(100deg,#1f5eff,#2563eb_50%,#0369a1)] text-white font-bold shadow-[0_12px_40px_-10px_rgba(31,94,255,0.55)] hover:brightness-105 transition';

const Pill = ({ children, className = '' }) => (
  <span className={`inline-block text-[13px] font-bold px-2.5 py-1 rounded-full ${className}`}
    style={{ color: `var(--accent, ${GOLD})`, background: tint(14), border: `1px solid ${tint(35)}` }}>
    {children}
  </span>
);

const Panel = ({ title, sub, to, action = 'View all', accent = GOLD, children, className = '' }) => (
  <section style={{ '--accent': accent }}
    className={`${glass} rounded-2xl shadow-[0_14px_36px_-20px_rgba(10,31,92,0.4)] ${className}`}>
    <header className="flex items-start justify-between gap-3 px-4 sm:px-7 pt-5 sm:pt-7">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-1.5 self-stretch min-h-[2rem] rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] shrink-0" />
        <div className="min-w-0">
          <h2 className="font-['Barlow_Condensed'] text-[1.75rem] sm:text-4xl font-bold leading-tight text-[#0a1f5c] break-words">{title}</h2>
          {sub && <p className="text-sm text-[#475569] mt-1 break-words">{sub}</p>}
        </div>
      </div>
      {to && (
        <Link to={to}
          style={{ color: 'var(--accent)', background: tint(10), border: `1px solid ${tint(40)}` }}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold hover:brightness-95 transition ${focusRing}`}>{action}</Link>
      )}
    </header>
    <div className="p-4 sm:p-7 min-w-0">{children}</div>
  </section>
);

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

const Side = ({ t }) => (
  <div className="flex flex-col items-center gap-2 text-center min-w-0">
    <Logo t={t} size="w-12 h-12 sm:w-14 sm:h-14" />
    <span className="text-sm font-semibold leading-tight line-clamp-2 break-words w-full text-[#0a1f5c]">{t?.shortName || t?.name}</span>
  </div>
);

const MatchCard = ({ m }) => (
  <article className="min-w-0 rounded-2xl border border-[#c7d7f5] bg-white/70 p-4 sm:p-5 flex flex-col gap-4 hover:border-[#1f5eff]/40 transition-colors">
    <div className="flex items-center justify-between gap-2">
      <p className="text-[13px] sm:text-sm text-[#475569] truncate min-w-0">{m.tournament?.name}{m.round && ` · ${m.round}`}</p>
      <StatusPill m={m} />
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <Side t={m.teamA} />
      <b className="font-['Barlow_Condensed'] text-3xl sm:text-4xl text-[#0a1f5c] px-1 whitespace-nowrap">
        {m.status === 'upcoming' ? 'vs' : `${m.scoreA} - ${m.scoreB}`}
      </b>
      <Side t={m.teamB} />
    </div>
    <p className="text-[13px] sm:text-sm text-center text-[#475569] border-t border-[#c7d7f5] pt-3 truncate">
      {fmtDate(m.date)}{m.time && ` · ${m.time}`}{m.venue && ` · ${m.venue}`}
    </p>
  </article>
);

const Empty = ({ children }) => (
  <div className="rounded-xl border border-dashed border-[#cfdcf7] bg-white/70 px-4 py-8 text-center text-[#475569]">{children}</div>
);

const byDate = (a, b) => new Date(a.date) - new Date(b.date);

export default function FootballHome() {
  const [d, setD] = useState({ matches: [], tournaments: [], teams: [], players: [], table: [] });
  const [tab, setTab] = useState(null);

  usePolling(async () => {
    try {
      const [m, t, tm, p] = await Promise.all([FAPI.get('/matches'), FAPI.get('/tournaments'), FAPI.get('/teams'), FAPI.get('/auction')]);
      const active = t.data.find((x) => x.status === 'ongoing') || t.data[0];
      const table = active ? (await FAPI.get(`/points/table/${active._id}`)).data : [];
      setD({ matches: m.data, tournaments: t.data, teams: tm.data, players: p.data, table, active });
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
    ['Tournaments', d.tournaments.length, '/sports/football/tournament', 'trophy', GOLD],
    ['Teams', d.teams.length, '/sports/football/team', 'teams', CYAN],
    ['Matches', d.matches.length, '/sports/football/schedule', 'calendar', VIOLET],
    ['Players sold', sold.length, '/sports/football/auction', 'tag', LIVE]
  ];

  return (
    /* "dark" class: StandingsTable's own dark: styles switch on inside this page (class-based dark mode) */
    <div className="[color-scheme:light] relative isolate bg-[linear-gradient(160deg,#dce8ff,#eef3ff_40%,#e3e8ff)] text-[#0a1f5c] min-h-screen overflow-x-hidden" style={{ '--accent': GOLD }}>
      {/* ---------- Ambient background (same orbs + grid as cricket) ---------- */}
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

      {/* ---------- Hero ---------- */}
      <div className="relative overflow-hidden border-b border-[#c7d7f5]">
        <svg className="absolute inset-0 w-full h-full text-[#1f5eff] opacity-[0.07]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 300" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="3"><rect x="20" y="20" width="760" height="260" /><line x1="400" y1="20" x2="400" y2="280" />
            <circle cx="400" cy="150" r="55" /><rect x="20" y="85" width="110" height="130" /><rect x="670" y="85" width="110" height="130" /></g>
        </svg>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-24 sm:pb-28 text-center">
          <p className="text-sm sm:text-base font-medium text-[#475569]">Brahmaputra International University</p>
          <h1 className="font-['Barlow_Condensed'] text-6xl sm:text-7xl md:text-8xl font-bold leading-none mt-2 text-[#0a1f5c]">BRIU Football</h1>

          {hero ? (
            <div style={{ '--accent': CYAN }}
              className={`${glass} w-full max-w-2xl mx-auto mt-8 sm:mt-10 text-[#0a1f5c] rounded-3xl p-5 sm:p-8 shadow-[0_24px_60px_-28px_rgba(10,31,92,0.25),0_0_80px_-30px_rgba(14,165,233,0.35)]`}>
              <div className="flex justify-center mb-5">
                {hero.status === 'live'
                  ? <StatusPill m={hero} />
                  : <span className="px-3.5 py-1.5 rounded-full text-sm font-bold"
                      style={{ color: GOLD, background: 'rgba(31,94,255,0.14)', border: '1px solid rgba(31,94,255,0.35)' }}>Next match · {fmtDate(hero.date)}{hero.time && ` · ${hero.time}`}</span>}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
                <div className="flex flex-col items-center gap-3 min-w-0">
                  <Logo t={hero.teamA} size="w-16 h-16 sm:w-24 sm:h-24" />
                  <b className="text-sm sm:text-lg leading-tight line-clamp-2 break-words w-full">{hero.teamA?.name}</b>
                </div>
                <div className="font-['Barlow_Condensed'] text-5xl sm:text-7xl font-bold whitespace-nowrap text-transparent bg-clip-text bg-[linear-gradient(100deg,#1f5eff,#0ea5e9)]">
                  {hero.status === 'upcoming' ? 'vs' : `${hero.scoreA} - ${hero.scoreB}`}
                </div>
                <div className="flex flex-col items-center gap-3 min-w-0">
                  <Logo t={hero.teamB} size="w-16 h-16 sm:w-24 sm:h-24" />
                  <b className="text-sm sm:text-lg leading-tight line-clamp-2 break-words w-full">{hero.teamB?.name}</b>
                </div>
              </div>
              <p className="text-sm text-[#475569] mt-5 pt-4 border-t border-[#c7d7f5] truncate">
                {hero.tournament?.name}{hero.round && ` · ${hero.round}`}{hero.venue && ` · ${hero.venue}`}
              </p>
            </div>
          ) : (
            <p className="mt-8 text-[#475569]">Fixtures will appear here once the schedule is published.</p>
          )}

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/sports/football/schedule" className={`px-6 py-3 rounded-xl ${primaryBtn} ${focusRing}`}>See full schedule</Link>
            <Link to="/sports/football/point-table" className={`px-6 py-3 rounded-xl border border-[#bcd0f5] bg-white/70 text-[#0a1f5c] font-bold hover:bg-[#e8f0ff] hover:border-[#1f5eff]/50 transition-colors ${focusRing}`}>Open point table</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        {/* ---------- Stats strip (overlaps hero) ---------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 -mt-12 sm:-mt-14 relative z-10 mb-8 sm:mb-10">
          {stats.map(([label, value, to, icon, accent]) => (
            <Link key={label} to={to} style={{ '--accent': accent }}
              className={`group ${glass} rounded-2xl p-4 sm:p-6 shadow-[0_14px_36px_-20px_rgba(10,31,92,0.4)] hover:-translate-y-1 hover:border-[var(--accent)] transition ${focusRing}`}>
              <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl grid place-items-center mb-3 sm:mb-4"
                style={{ color: accent, background: tint(16), border: `1px solid ${tint(40)}`, boxShadow: `0 0 28px -4px ${accent}` }}><Icon name={icon} /></span>
              <b className="block font-['Barlow_Condensed'] text-4xl sm:text-5xl leading-none text-transparent bg-clip-text bg-[linear-gradient(100deg,#1f5eff,#0ea5e9)]">{value}</b>
              <span className="block text-sm sm:text-base text-[#475569] mt-1.5">{label}</span>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-6 sm:gap-8">
          {/* ---------- Match center ---------- */}
          <Panel accent={GOLD} title="Fixtures and results" sub="Live scores, upcoming matches and latest results" to="/sports/football/schedule">
            <div className="grid grid-cols-3 gap-2 mb-5 sm:flex sm:overflow-x-auto sm:pb-1" role="tablist">
              {tabs.map(([k, label, list]) => (
                <button key={k} role="tab" aria-selected={current === k} onClick={() => setTab(k)}
                  className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-full text-[13px] sm:text-sm font-semibold transition-colors sm:shrink-0 ${focusRing} ${
                    current === k ? 'bg-[#1f5eff] text-white shadow-[0_10px_30px_-8px_#1f5eff]' : 'bg-[#e8f0ff] text-[#475569] hover:bg-[#dbe7ff] hover:text-[#0a1f5c]'}`}>
                  {k === 'live' && list.length > 0 && <span className="w-2 h-2 rounded-full bg-[#e11d48] animate-pulse" />}
                  {label}
                  <span className={`hidden sm:inline text-[13px] px-1.5 rounded-full ${current === k ? 'bg-white/25' : 'bg-[#e8f0ff]'}`}>{list.length}</span>
                </button>
              ))}
            </div>
            {shown.length > 0
              ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((m) => <MatchCard key={m._id} m={m} />)}</div>
              : <Empty>{emptyText}</Empty>}
          </Panel>

          {/* ---------- Standings + side column ---------- */}
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 items-start">
            <Panel accent={CYAN} className="lg:col-span-2 min-w-0" title="Standings" sub={active?.name} to="/sports/football/point-table" action="Full table">
              {d.table.length > 0
                ? <StandingsTable rows={d.table} format={active?.format} limit={8} bare />
                : <Empty>Standings will appear after the first completed match.</Empty>}
            </Panel>

            <div className="flex flex-col gap-6 sm:gap-8 min-w-0">
              <Panel accent={VIOLET} title="Tournament in focus">
                {active ? (
                  <div>
                    <h3 className="text-lg font-bold text-[#0a1f5c] leading-snug">{active.name}</h3>
                    <Pill className="mt-2 capitalize">{active.status}</Pill>
                    <p className="text-sm text-[#475569] mt-3">{formatLabel(active)}</p>
                    <p className="text-sm text-[#475569] mt-1">
                      {fmtDate(active.startDate)}{active.endDate && ` to ${fmtDate(active.endDate)}`}{active.venue && ` · ${active.venue}`}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <Link to="/sports/football/schedule" className={`text-center px-3 py-2.5 rounded-xl text-sm ${primaryBtn} ${focusRing}`}>Fixtures</Link>
                      <Link to="/sports/football/point-table"
                        style={{ color: 'var(--accent)', border: `1px solid ${tint(40)}`, background: tint(10) }}
                        className={`text-center px-3 py-2.5 rounded-xl text-sm font-bold hover:brightness-95 transition ${focusRing}`}>Standings</Link>
                    </div>
                  </div>
                ) : <Empty>No tournament yet.</Empty>}
              </Panel>

              <Panel accent={LIVE} title="Player auction" to="/sports/football/auction" action="Open">
                {livePlayer ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-[#e11d48] text-white text-[13px] font-bold px-2.5 py-1 rounded-full shadow-[0_0_22px_-4px_#e11d48]">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
                    </span>
                    <h3 className="text-lg font-bold text-[#0a1f5c] mt-3">{livePlayer.name} <span className="font-medium text-[#475569]">({livePlayer.position})</span></h3>
                    <p className="text-sm text-[#475569] mt-1">
                      Current bid <b className="text-[#1f5eff]">{livePlayer.currentBid}</b>{livePlayer.currentTeam && ` by ${livePlayer.currentTeam.name}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#475569]">No player on the block right now. <b className="text-[#1f5eff]">{sold.length}</b> players sold so far.</p>
                )}
              </Panel>
            </div>
          </div>

          {/* ---------- Tournaments ---------- */}
          <Panel accent={VIOLET} title="Tournaments" sub="Browse every competition" to="/sports/football/tournament">
            {d.tournaments.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {d.tournaments.slice(0, 3).map((t) => (
                  <Link key={t._id} to="/sports/football/tournament"
                    className={`group rounded-2xl overflow-hidden border border-[#c7d7f5] bg-white/70 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_26px_60px_-22px_var(--accent)] transition ${focusRing}`}>
                    {t.banner
                      ? <img src={t.banner} alt="" className="h-40 sm:h-44 w-full object-cover" />
                      : <div className="h-40 sm:h-44 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.30),#eaf1ff_75%)] grid place-items-center text-[#4f46e5]"><Icon name="trophy" className="w-12 h-12" /></div>}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <b className="text-[#0a1f5c] leading-snug">{t.name}</b>
                        <Pill className="capitalize shrink-0">{t.status}</Pill>
                      </div>
                      <p className="text-sm text-[#475569] mt-2 capitalize">{t.category}</p>
                      <p className="text-sm text-[#475569]">{formatLabel(t)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <Empty>No tournament has been added yet.</Empty>}
          </Panel>

          {/* ---------- Teams ---------- */}
          <Panel accent={CYAN} title="Teams" sub={`${d.teams.length} registered`} to="/sports/football/team">
            {d.teams.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
                {d.teams.slice(0, 12).map((t) => (
                  <Link key={t._id} to="/sports/football/team"
                    className={`flex flex-col items-center gap-2.5 text-center rounded-2xl p-3 sm:p-4 bg-white/70 border border-[#c7d7f5] hover:-translate-y-1 hover:border-[var(--accent)] transition ${focusRing}`}>
                    <Logo t={t} size="w-14 h-14 sm:w-16 sm:h-16" />
                    <span className="text-[13px] sm:text-sm font-semibold leading-tight line-clamp-2 break-words w-full text-[#0a1f5c]">{t.name}</span>
                  </Link>
                ))}
              </div>
            ) : <Empty>No team has been registered yet.</Empty>}
          </Panel>
        </div>
      </div>
    </div>
  );
}