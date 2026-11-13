import React from 'react';

export const formatLabel = (t) => {
  if (!t) return '';
  const legs = t.legs === 2 ? 'home & away' : 'single leg';
  return t.format === 'group_round_robin'
    ? `Group stage + round robin · ${t.groupCount} groups · top ${t.qualifyPerGroup} qualify · ${legs}`
    : `Round robin · ${legs}`;
};

export const tiebreakText = (t) => (t?.tiebreak === 'uefa'
  ? 'head-to-head points, head-to-head goal difference, head-to-head goals, then overall goal difference and goals scored'
  : 'goal difference, goals scored, then head-to-head record');

const gdValue = (r) => r.gf - r.ga;
const gdText = (r) => { const d = gdValue(r); return d > 0 ? `+${d}` : d; };
const gdColor = (r) => { const d = gdValue(r); return d > 0 ? 'text-[#15803d]' : d < 0 ? 'text-[#dc2626]' : 'text-[#52525B]'; };

/* Always light (no dark: variants). Navy header row, same as the main Home cards. */
function Table({ rows, compact, highlightLeader, bare }) {
  const wrap = bare
    ? 'overflow-x-auto rounded-xl border border-[#E4E4E7] bg-white'
    : 'overflow-x-auto rounded-2xl border border-[#E4E4E7] bg-white';
  const th = 'py-3 px-2 text-center font-semibold text-[13px] text-white whitespace-nowrap';
  return (
    <div className={`${wrap} text-[#09090B]`} style={{ color: '#09090B' }}>
      <table className="w-full min-w-[380px] text-[15px] tabular-nums">
        <thead className="bg-[#166534]">
          <tr>
            <th className={`${th} !text-left !pl-4 w-12`}>#</th>
            <th className={`${th} !text-left`}>Team</th>
            <th className={th} title="Played">P</th>
            <th className={th} title="Won">W</th>
            <th className={th} title="Drawn">D</th>
            <th className={th} title="Lost">L</th>
            {!compact && <><th className={th} title="Goals for">GF</th><th className={th} title="Goals against">GA</th></>}
            <th className={th} title="Goal difference">GD</th>
            <th className={`${th} !pr-4`} title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const leader = highlightLeader && i === 0;
            const tone = r.qualified ? 'bg-[#ECFDF3]' : leader ? 'bg-[#FFF8E1]' : i % 2 ? 'bg-[#FAFAFB]' : 'bg-white';
            const edge = r.qualified ? 'border-l-4 border-[#16a34a]' : leader ? 'border-l-4 border-[#F59E0B]' : 'border-l-4 border-transparent';
            return (
              <tr key={r._id} className={`border-t border-[#E4E4E7] ${tone} transition-colors hover:bg-[#EEF7F1] [&>td]:py-3 [&>td]:px-2 [&>td]:text-center`}>
                <td className={`!text-left !pl-3 font-bold ${edge}`}>{r.rank || i + 1}</td>
                <td className="!text-left font-semibold whitespace-nowrap">
                  <span className="inline-flex items-center gap-2.5">
                    {r.team?.logo && <img src={r.team.logo} alt="" className="w-8 h-8 rounded-full object-cover bg-white border border-[#E4E4E7]" />}
                    {r.team?.name}
                  </span>
                </td>
                <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
                {!compact && <><td>{r.gf}</td><td>{r.ga}</td></>}
                <td className={`font-semibold ${gdColor(r)}`}>{gdText(r)}</td>
                <td className="!pr-4">
                  <span className="inline-block min-w-[2.25rem] rounded-lg bg-[#166534] px-2 py-1 font-bold text-white">{r.points}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Legend = ({ compact }) => (
  <p className="mt-2 text-[13px] leading-relaxed text-[#52525B]">
    P played · W won · D drawn · L lost · {!compact && 'GF goals for · GA goals against · '}GD goal difference · Pts points
  </p>
);

// rows come from GET /points/table/:id (already ranked, with group / rank / qualified)
// bare = no outer card (use inside a Panel)
export default function StandingsTable({ rows, format, compact = false, limit, bare = false }) {
  if (format === 'group_round_robin') {
    const groups = {};
    rows.forEach((r) => { (groups[r.group || ''] = groups[r.group || ''] || []).push(r); });
    return (
      <div>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.keys(groups).sort().map((g) => (
            <div key={g} className="min-w-0">
              <h3 className="fd text-2xl font-bold text-[#166534] mb-2">{g ? `Group ${g}` : 'Not in a group yet'}</h3>
              <Table rows={groups[g]} compact bare={bare} />
            </div>
          ))}
        </div>
        <Legend compact />
      </div>
    );
  }
  return (
    <div>
      <Table rows={limit ? rows.slice(0, limit) : rows} compact={compact} bare={bare} highlightLeader />
      <Legend compact={compact} />
    </div>
  );
}