import React, { useState, useEffect } from 'react';
import Header from './header';
import API from '../../services/api'; // আপনার প্রজেক্টের API সার্ভিস পাথ অনুযায়ী ঠিক করে নিন

/* ------------------------------------------------------------------
   UI-only helpers (no business logic)
------------------------------------------------------------------- */
const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';

// Cursor-following spotlight for cards
const trackGlow = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

// Number display (thousands separators)
function CountUp({ value }) {
  const n = Number(value);
  return <>{Number.isFinite(n) ? n.toLocaleString() : (value ?? '-')}</>;
}

function Avatar({ src, name, size = 56 }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.36 };
  if (!src || failed) {
    return <div className="ct-avatar ct-avatar-fallback" style={style} aria-hidden="true">{initials(name)}</div>;
  }
  return <img className="ct-avatar" src={src} alt={name || ''} style={style} onError={() => setFailed(true)} />;
}

function Chevron() {
  return (
    <svg className="ct-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CTeam() {
  const [selectedCategory, setSelectedCategory] = useState(null); // 'official', 'central', 'franchise'
  const [selectedTeam, setSelectedTeam] = useState(null);         // Selected Team object
  const [selectedPlayer, setSelectedPlayer] = useState(null);     // Selected Player object

  const [teamsFromDB, setTeamsFromDB] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch teams from backend API on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await API.get('/api/cricket/teams');
        setTeamsFromDB(res.data || []);
      } catch (error) {
        console.error('Error fetching teams from database:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Category Configuration for UI styling and titles
  const categoryDetails = {
    official: {
      title: "BRIU Cricket Team Squad",
      short: "Official squad",
      themeColor: "#1f5eff",
      description: ""
    },
    central: {
      title: "Central Cricket Teams",
      short: "Central teams",
      themeColor: "#0369a1",
      description: ""
    },
    franchise: {
      title: "Franchise Cricket Teams",
      short: "Franchise teams",
      themeColor: "#4f46e5",
      description: ""
    }
  };

  // Filter teams based on selected category from database
  const filteredTeams = teamsFromDB.filter(t => t.category === selectedCategory);

  const handleBack = () => {
    if (selectedPlayer) {
      setSelectedPlayer(null);
    } else if (selectedTeam) {
      setSelectedTeam(null);
    } else {
      setSelectedCategory(null);
    }
  };

  // Breadcrumb jumps (reuse the same state setters)
  const goTiers = () => { setSelectedPlayer(null); setSelectedTeam(null); setSelectedCategory(null); };
  const goCategory = () => { setSelectedPlayer(null); setSelectedTeam(null); };
  const goTeam = () => { setSelectedPlayer(null); };

  const accent = selectedCategory ? categoryDetails[selectedCategory].themeColor : '#1f5eff';
  const atRoot = !selectedCategory && !selectedTeam && !selectedPlayer;

  // Key so each level renders as a fresh view
  const viewKey = `${selectedCategory}-${selectedTeam?._id || ''}-${selectedPlayer?._id || selectedPlayer?.id || ''}`;

  return (
    <div className="ct-page" style={{ '--accent': accent }}>
      <div className="ct-bg" aria-hidden="true">
        <span className="ct-orb ct-orb-1" />
        <span className="ct-orb ct-orb-2" />
        <span className="ct-orb ct-orb-3" />
        <span className="ct-grid" />
      </div>

      <Header />

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Figtree:wght@400;500;600;700&display=swap');

          @property --ang { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

          /* Light theme: same palette as the football and badminton pages.
             page #dce8ff to #e3e8ff · ink #0a1f5c · muted #475569 · line #c7d7f5
             accents: blue #1f5eff · sky #0369a1 · indigo #4f46e5 */
          .ct-page {
            --ink: #0a1f5c;
            --muted: #475569;
            --line: #c7d7f5;
            --card: linear-gradient(180deg, #ffffff, #f4f8ff);
            --shadow: 0 14px 36px -20px rgba(10, 31, 92, 0.4);
            position: relative; isolation: isolate; overflow-x: hidden; color-scheme: light;
            min-height: 100vh; color: var(--ink);
            background: linear-gradient(160deg, #dce8ff, #eef3ff 40%, #e3e8ff);
            font-family: 'Figtree', 'Segoe UI', Tahoma, sans-serif;
          }
          .ct-page *, .ct-page *::before, .ct-page *::after { box-sizing: border-box; }
          .ct-display { font-family: 'Barlow Condensed', 'Segoe UI', sans-serif; letter-spacing: 0; }
          .ct-wrap { position: relative; width: 100%; max-width: 900px; margin: 0 auto; padding: 22px 16px 64px; }

          /* ---------- Soft background ---------- */
          .ct-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
          .ct-orb { position: absolute; border-radius: 50%; background: radial-gradient(closest-side, var(--c) 35%, transparent 100%); }
          .ct-orb-1 { width: 520px; height: 520px; top: -160px; left: -120px; --c: var(--accent); opacity: .16; }
          .ct-orb-2 { width: 460px; height: 460px; top: 30%; right: -160px; --c: #1f5eff; opacity: .2; }
          .ct-orb-3 { width: 420px; height: 420px; bottom: -160px; left: 25%; --c: #4f46e5; opacity: .12; }
          .ct-grid {
            position: absolute; inset: 0;
            background-image: linear-gradient(rgba(31,94,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(31,94,255,.07) 1px, transparent 1px);
            background-size: 44px 44px;
            -webkit-mask-image: radial-gradient(ellipse at 50% 30%, #000 0%, transparent 70%);
            mask-image: radial-gradient(ellipse at 50% 30%, #000 0%, transparent 70%);
          }

          /* ---------- Breadcrumb bar ---------- */
          .ct-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; min-height: 44px; }
          .ct-back {
            flex: none; display: inline-flex; align-items: center; gap: 6px;
            height: 44px; padding: 0 18px 0 12px; border-radius: 999px;
            border: 1px solid var(--line); background: #fff; box-shadow: var(--shadow);
            color: var(--ink); font: 700 15px 'Figtree', sans-serif; cursor: pointer;
            transition: border-color .2s, color .2s, transform .2s;
          }
          .ct-back svg { transition: transform .2s; }
          .ct-back:hover { border-color: var(--accent); color: var(--accent); }
          .ct-back:hover svg { transform: translateX(-3px); }
          .ct-crumbs { display: flex; align-items: center; gap: 6px; overflow-x: auto; white-space: nowrap; scrollbar-width: none; font-size: 15px; color: var(--muted); }
          .ct-crumbs::-webkit-scrollbar { display: none; }
          .ct-crumb { background: none; border: 0; padding: 4px 2px; font: inherit; color: var(--muted); cursor: pointer; transition: color .2s; }
          .ct-crumb:hover { color: var(--ink); }
          .ct-crumb[aria-current="page"] { color: var(--accent); font-weight: 700; cursor: default; }
          .ct-sep { color: #94a3b8; }

          /* ---------- Headings ---------- */
          .ct-h1 { margin: 0 0 8px; font-size: clamp(36px, 7vw, 56px); line-height: 1.02; font-weight: 700; }
          .ct-h1-sheen { color: var(--ink); }
          .ct-h1-glow { color: var(--ink); }
          .ct-lead { margin: 0 0 28px; color: var(--muted); font-size: 16px; line-height: 1.6; max-width: 58ch; }

          /* ---------- Card row ---------- */
          .ct-list { display: flex; flex-direction: column; gap: 14px; }
          .ct-row {
            position: relative; isolation: isolate; overflow: hidden;
            width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer;
            background: var(--card); box-shadow: var(--shadow);
            border: 1px solid var(--line); border-radius: 18px;
            display: flex; align-items: center; gap: 16px;
            transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, border-color .25s;
          }
          /* cursor spotlight (soft tint) */
          .ct-row::before {
            content: ''; position: absolute; inset: 0; z-index: -1; opacity: 0; transition: opacity .3s;
            background: radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 12%, transparent), transparent 62%);
          }
          @media (hover: hover) {
            .ct-row:hover { transform: translateY(-3px); border-color: var(--accent);
              box-shadow: 0 18px 44px -20px color-mix(in srgb, var(--accent) 55%, transparent); }
            .ct-row:hover::before { opacity: 1; }
          }
          .ct-row:active { transform: translateY(-1px) scale(.995); }
          .ct-page :focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

          .ct-chevron { flex: none; color: #64748b; transition: transform .25s, color .25s; }
          @media (hover: hover) { .ct-row:hover .ct-chevron { color: var(--accent); transform: translateX(5px); } }

          /* ---------- Avatar ---------- */
          .ct-avatar { flex: none; border-radius: 50%; object-fit: cover; display: block; background: #fff; border: 2px solid color-mix(in srgb, var(--accent) 45%, #fff); transition: transform .3s; }
          @media (hover: hover) { .ct-row:hover .ct-avatar { transform: scale(1.05); } }
          .ct-avatar-fallback { display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--accent); background: radial-gradient(circle at 30% 25%, #ffffff, #dbe7ff); font-family: 'Barlow Condensed', sans-serif; }

          /* ---------- Level 1: tiers ---------- */
          .ct-tier { padding: 0; min-height: 124px; }
          .ct-tier-num {
            flex: none; align-self: stretch; width: 104px; position: relative; overflow: hidden;
            background: linear-gradient(160deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #0a1f5c));
            color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
          }
          .ct-tier-num b { font-family: 'Barlow Condensed', sans-serif; font-size: 46px; line-height: 1; font-weight: 700; }
          .ct-tier-num span { font-size: 13px; font-weight: 700; }
          .ct-tier-body { flex: 1; padding: 18px 0; min-width: 0; }
          .ct-tier-body h3 { margin: 0 0 5px; font-size: 28px; font-weight: 700; line-height: 1.1; color: var(--ink); }
          .ct-tier-body p { margin: 0; font-size: 15px; color: var(--muted); line-height: 1.5; }
          .ct-tier .ct-chevron { margin-right: 18px; }

          /* ---------- Level 2: teams ---------- */
          .ct-team { padding: 18px; }
          .ct-team-body { flex: 1; min-width: 0; }
          .ct-team-body h3 { margin: 0 0 4px; font-size: 26px; font-weight: 700; line-height: 1.1; color: var(--ink); }
          .ct-team-body p { margin: 0; font-size: 15px; color: var(--muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .ct-pill, .ct-role {
            display: inline-block; border-radius: 999px; font-weight: 700; color: var(--accent);
            background: color-mix(in srgb, var(--accent) 10%, #fff);
            border: 1px solid color-mix(in srgb, var(--accent) 40%, #fff);
          }
          .ct-pill { margin-top: 10px; padding: 4px 12px; font-size: 13px; }
          .ct-role { padding: 3px 11px; font-size: 13px; }

          /* ---------- Level 3: players ---------- */
          .ct-team-head { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
          .ct-player { padding: 15px 18px; }
          .ct-player-main { flex: 1; min-width: 0; }
          .ct-player-main h4 { margin: 0 0 6px; font-size: 18px; font-weight: 700; color: var(--ink); }
          .ct-mini { display: flex; gap: 20px; flex: none; }
          .ct-mini div { text-align: right; min-width: 52px; }
          .ct-mini b { display: block; font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 700; line-height: 1.1; color: var(--ink); }
          @media (hover: hover) { .ct-row:hover .ct-mini b { color: var(--accent); } }
          .ct-mini span { font-size: 12px; color: var(--muted); font-weight: 600; }
          .ct-player-sub { display: none; gap: 12px; margin-top: 8px; font-size: 13px; color: var(--muted); }
          .ct-player-sub b { color: var(--ink); }
          @media (max-width: 560px) {
            .ct-mini { display: none; }
            .ct-player-sub { display: flex; }
            .ct-tier-num { width: 82px; }
            .ct-tier-num b { font-size: 36px; }
            .ct-tier-body h3 { font-size: 24px; }
          }

          /* ---------- Level 4: profile ---------- */
          .ct-profile { position: relative; overflow: hidden; border-radius: 26px; border: 1px solid var(--line); background: var(--card); box-shadow: 0 24px 60px -30px rgba(10, 31, 92, 0.45); }
          .ct-cover { position: relative; height: 130px; overflow: hidden;
            background: radial-gradient(520px 180px at 18% 0%, color-mix(in srgb, var(--accent) 35%, #fff), transparent 70%), linear-gradient(135deg, #e3edff, #f4f8ff); }
          .ct-profile-body { padding: 0 26px 30px; }
          .ct-profile-top { position: relative; z-index: 1; display: flex; align-items: flex-start; gap: 20px; margin-top: -54px; flex-wrap: wrap; }
          .ct-orbit { position: relative; flex: none; padding: 5px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 40%, #fff)); }
          .ct-orbit .ct-avatar { position: relative; z-index: 1; border: 4px solid #fff; }
          .ct-profile-name { position: relative; min-width: 0; flex: 1 1 220px; padding-top: 4px; }
          /* wide screens: name sits fully below the cover, beside the avatar */
          @media (min-width: 561px) { .ct-profile-name { margin-top: 74px; padding-top: 0; } }
          .ct-profile-name h2 { margin: 0 0 8px; font-size: clamp(34px, 7vw, 48px); font-weight: 700; line-height: 1.05; color: var(--ink); }
          .ct-bio { margin: 24px 0 26px; max-width: 62ch; font-size: 16px; line-height: 1.75; color: #334155; }
          .ct-bio.ct-bio-empty { color: var(--muted); font-style: italic; }
          .ct-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .ct-stat { position: relative; padding: 20px 10px; text-align: center; border-radius: 18px; border: 1px solid var(--line); background: #fff; overflow: hidden; }
          .ct-stat::before { content: ''; position: absolute; inset: auto 0 0 0; height: 55%; background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%); }
          .ct-stat b { position: relative; display: block; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(36px, 9vw, 56px); font-weight: 700; line-height: 1; color: var(--accent); }
          .ct-stat span { position: relative; display: block; margin-top: 8px; font-size: 14px; color: var(--muted); font-weight: 600; }

          /* ---------- Empty + loading ---------- */
          .ct-empty { padding: 40px 22px; text-align: center; border: 1px dashed #bcd0f5; border-radius: 18px; color: var(--muted); font-size: 16px; background: rgba(255,255,255,.7); }
          .ct-skel { height: 110px; border-radius: 18px; border: 1px solid var(--line); background: #e3edff; animation: ct-pulse 1.4s ease-in-out infinite; }
          @keyframes ct-pulse { 50% { opacity: .55; } }

          /* ---------- Phones: keep the site header readable on the light page ---------- */
          @media (max-width: 900px), (pointer: coarse) {
            .ct-page > header { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background-color: rgba(255,255,255,.97) !important; }
          }

          @media (prefers-reduced-motion: reduce) {
            .ct-page *, .ct-page *::before, .ct-page *::after { animation: none !important; transition: none !important; }
          }
        `}
      </style>

      <div className="ct-wrap">

        {/* Back + breadcrumb */}
        {!atRoot && (
          <nav className="ct-bar" aria-label="Breadcrumb">
            <button className="ct-back" onClick={handleBack}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <div className="ct-crumbs">
              <button className="ct-crumb" onClick={goTiers}>All teams</button>
              {selectedCategory && (<>
                <span className="ct-sep">/</span>
                <button className="ct-crumb" onClick={goCategory} aria-current={!selectedTeam ? 'page' : undefined}>
                  {categoryDetails[selectedCategory].short}
                </button>
              </>)}
              {selectedTeam && (<>
                <span className="ct-sep">/</span>
                <button className="ct-crumb" onClick={goTeam} aria-current={!selectedPlayer ? 'page' : undefined}>
                  {selectedTeam.name}
                </button>
              </>)}
              {selectedPlayer && (<>
                <span className="ct-sep">/</span>
                <span className="ct-crumb" aria-current="page">{selectedPlayer.name}</span>
              </>)}
            </div>
          </nav>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="ct-list" role="status" aria-label="Loading teams">
            <div className="ct-skel" /><div className="ct-skel" /><div className="ct-skel" />
          </div>
        )}

        {!loading && (
          <div key={viewKey}>

            {/* ---------------- LEVEL 1: TIERS ---------------- */}
            {!selectedCategory && (
              <div>
                <h2 className="ct-h1 ct-display ct-h1-sheen ct-in">Cricket teams</h2>
                <p className="ct-lead ct-in" style={{ '--i': 1 }}>Choose a group to see its teams, players and career numbers.</p>

                <div className="ct-list">
                  {Object.keys(categoryDetails).map((catKey, idx) => {
                    const cat = categoryDetails[catKey];
                    const count = teamsFromDB.filter(t => t.category === catKey).length;
                    return (
                      <button
                        key={catKey}
                        onClick={() => setSelectedCategory(catKey)}
                        onMouseMove={trackGlow}
                        className="ct-row ct-tier ct-in"
                        style={{ '--accent': cat.themeColor, '--i': idx + 2 }}
                      >
                        <div className="ct-tier-num">
                          <b><CountUp value={count} /></b>
                          <span>{count === 1 ? 'team' : 'teams'}</span>
                        </div>
                        <div className="ct-tier-body">
                          <h3 className="ct-display">{cat.title}</h3>
                          <p>{cat.description}</p>
                        </div>
                        <Chevron />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- LEVEL 2: TEAM LIST ---------------- */}
            {selectedCategory && !selectedTeam && !selectedPlayer && (
              <div>
                <h2 className="ct-h1 ct-display ct-h1-glow ct-in">{categoryDetails[selectedCategory].title}</h2>
                <p className="ct-lead ct-in" style={{ '--i': 1 }}>Tap a team to see its players.</p>

                {filteredTeams.length === 0 ? (
                  <div className="ct-empty ct-in" style={{ '--i': 2 }}>
                    No teams in this group yet. Check back soon, or go back and try another group.
                  </div>
                ) : (
                  <div className="ct-list">
                    {filteredTeams.map((team, idx) => (
                      <button
                        key={team._id}
                        onClick={() => setSelectedTeam(team)}
                        onMouseMove={trackGlow}
                        className="ct-row ct-team ct-in"
                        style={{ '--i': idx + 2 }}
                      >
                        <Avatar src={team.logo} name={team.name} size={62} />
                        <div className="ct-team-body">
                          <h3 className="ct-display">{team.name}</h3>
                          <p>{team.description || 'No description provided.'}</p>
                          <span className="ct-pill">{team.players?.length || 0} players</span>
                        </div>
                        <Chevron />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- LEVEL 3: PLAYER LIST ---------------- */}
            {selectedTeam && !selectedPlayer && (
              <div>
                <div className="ct-team-head ct-in">
                  <Avatar src={selectedTeam.logo} name={selectedTeam.name} size={58} />
                  <h2 className="ct-h1 ct-display ct-h1-glow" style={{ margin: 0 }}>{selectedTeam.name}</h2>
                </div>
                <p className="ct-lead ct-in" style={{ marginTop: 12, '--i': 1 }}>
                  {selectedTeam.players?.length || 0} players. Tap a player to see the full profile.
                </p>

                {(!selectedTeam.players || selectedTeam.players.length === 0) ? (
                  <div className="ct-empty ct-in" style={{ '--i': 2 }}>No players in this team yet.</div>
                ) : (
                  <div className="ct-list">
                    {selectedTeam.players.map((player, idx) => (
                      <button
                        key={player._id || player.id}
                        onClick={() => setSelectedPlayer(player)}
                        onMouseMove={trackGlow}
                        className="ct-row ct-player ct-in"
                        style={{ '--i': idx + 2 }}
                      >
                        <Avatar src={player.img} name={player.name} size={58} />
                        <div className="ct-player-main">
                          <h4>{player.name}</h4>
                          <span className="ct-role">{player.role}</span>
                          <div className="ct-player-sub">
                            <span>Matches <b>{player.matches}</b></span>
                            <span>Runs <b>{player.runs}</b></span>
                            <span>Wkts <b>{player.wickets}</b></span>
                          </div>
                        </div>
                        <div className="ct-mini">
                          <div><b>{player.matches}</b><span>Matches</span></div>
                          <div><b>{player.runs}</b><span>Runs</span></div>
                          <div><b>{player.wickets}</b><span>Wickets</span></div>
                        </div>
                        <Chevron />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- LEVEL 4: PLAYER PROFILE ---------------- */}
            {selectedPlayer && (
              <article className="ct-profile ct-in">
                <div className="ct-cover" />
                <div className="ct-profile-body">
                  <div className="ct-profile-top">
                    <div className="ct-orbit">
                      <Avatar src={selectedPlayer.img} name={selectedPlayer.name} size={112} />
                    </div>
                    <div className="ct-profile-name">
                      <h2 className="ct-display">{selectedPlayer.name}</h2>
                      <span className="ct-role">{selectedPlayer.role}</span>
                    </div>
                  </div>

                  <p className={`ct-bio ${selectedPlayer.bio ? '' : 'ct-bio-empty'}`}>
                    {selectedPlayer.bio || 'No career summary has been added for this player yet.'}
                  </p>

                  <div className="ct-stats">
                    <div className="ct-stat ct-in" style={{ '--i': 2 }}><b><CountUp value={selectedPlayer.matches} /></b><span>Matches</span></div>
                    <div className="ct-stat ct-in" style={{ '--i': 3 }}><b><CountUp value={selectedPlayer.runs} /></b><span>Career runs</span></div>
                    <div className="ct-stat ct-in" style={{ '--i': 4 }}><b><CountUp value={selectedPlayer.wickets} /></b><span>Wickets</span></div>
                  </div>
                </div>
              </article>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CTeam;