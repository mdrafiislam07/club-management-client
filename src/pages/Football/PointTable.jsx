import React, { useEffect, useState } from 'react';
import FAPI, { usePolling } from './footballApi';
import StandingsTable, { formatLabel, tiebreakText } from './StandingsTable';
import { PageShell, PageHero, Rv, Empty, Skeleton, STATUS_LABEL } from './FootballTheme';

const Stat = ({ label, value, className = '' }) => (
  <div className={`min-w-0 rounded-xl b-surf2 border b-line px-4 py-3 ${className}`}>
    <dt className="text-[13px] b-mute">{label}</dt>
    <dd className="mt-0.5 font-semibold text-[var(--ink)]">{value}</dd>
  </div>
);

export default function PointTable() {
  const [tours, setTours] = useState([]);
  const [tid, setTid] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    FAPI.get('/tournaments').then((r) => {
      setTours(r.data);
      const pick = r.data.find((t) => t.status === 'ongoing') || r.data[0];
      if (pick) setTid(pick._id); else setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, []);

  const load = () => {
    if (!tid) return Promise.resolve();
    return FAPI.get(`/points/table/${tid}`)
      .then((r) => { setRows(r.data); setError(false); setUpdated(new Date()); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  usePolling(load, 8000);
  useEffect(() => { if (tid) { setLoading(true); setRows([]); load(); } }, [tid]); // eslint-disable-line

  const cur = tours.find((t) => t._id === tid);
  const grouped = cur?.format === 'group_round_robin';
  const time = updated ? updated.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <PageShell>
      <PageHero title="Point table" sub="Live standings, updated automatically while matches are played." />

      <main className="fb-main">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          {/* tournament panel (hero er upor overlap) */}
          <section aria-label="Choose a tournament" className="fbp -mt-14 sm:-mt-16 relative z-10 p-4 sm:p-6 shadow-[0_18px_40px_-26px_rgba(22,101,52,.45)]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-end">
              <label className="block min-w-0">
                <span className="block text-sm font-semibold b-mute mb-1.5">Tournament</span>
                <select value={tid} onChange={(e) => setTid(e.target.value)} disabled={tours.length === 0} className="fld">
                  {tours.length === 0 && <option value="">No tournament</option>}
                  {tours.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </label>
              {cur && (
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className={`st ${cur.status === 'ongoing' ? 'st-ongoing' : cur.status === 'upcoming' ? 'st-upcoming' : 'st-completed'}`}>
                    {STATUS_LABEL[cur.status] || cur.status}
                  </span>
                  <span className="st st-upcoming max-w-full truncate">{formatLabel(cur)}</span>
                </div>
              )}
            </div>

            {cur && (
              <dl className={`mt-4 pt-4 border-t b-line grid grid-cols-2 gap-3 text-sm ${grouped ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                <Stat label="Points for a win" value={cur.pointsWin ?? 3} />
                <Stat label="Points for a draw" value={cur.pointsDraw ?? 1} />
                {grouped && <Stat label="Qualify per group" value={`Top ${cur.qualifyPerGroup}`} />}
                <Stat label="Ties are broken by" value={tiebreakText(cur)} className="col-span-2 md:col-span-1" />
              </dl>
            )}
          </section>

          {/* standings */}
          <div className="mt-10 sm:mt-12" aria-live="polite">
            {loading && <Skeleton n={6} h="h-10" />}

            {!loading && error && rows.length === 0 && (
              <Empty title="Couldn’t load standings" text="Check your connection. We’ll try again automatically." />
            )}

            {!loading && !error && rows.length === 0 && (
              <Empty
                title={tours.length === 0 ? 'No tournament yet' : 'No standings yet'}
                text={tours.length === 0 ? 'Standings will appear once a tournament is created.' : 'The table fills in after the first match is played.'} />
            )}

            {rows.length > 0 && (
              <Rv>
                <section className="fbp overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b b-line">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="hd-bar w-1.5 h-8 rounded-full shrink-0" />
                      <h2 className="fd text-3xl sm:text-4xl font-bold text-[var(--ink)] truncate">{cur?.name || 'Standings'}</h2>
                    </div>
                    {time && (
                      <span className="shrink-0 inline-flex items-center gap-2 text-[13px] font-semibold b-mute">
                        <span className={`w-2 h-2 rounded-full ${error ? 'bg-[#a1a1aa]' : 'bg-[#16a34a] animate-pulse motion-reduce:animate-none'}`} />
                        {error ? `Offline, last updated ${time}` : `Updated ${time}`}
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto p-2 sm:p-4">
                    <StandingsTable rows={rows} format={cur?.format} />
                  </div>
                </section>
              </Rv>
            )}

            {grouped && rows.length > 0 && (
              <p className="mt-4 text-sm b-mute flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#ECFDF3] border-l-4 border-[#16a34a]" aria-hidden="true" />
                Top {cur.qualifyPerGroup} of every group qualify for the next stage.
              </p>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}