import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import {
  Trophy, Target, Activity, Flame, Calendar, Zap, Award, ArrowRight, X, MapPin, Phone, Mail, Bell, Pin,
  Compass, Users, ChevronDown, Image as ImageIcon, Newspaper, Radio
} from 'lucide-react';

/* API endpoints (prothom ja kaj kore seta use hobe) */
const ENDPOINTS = {
  events: ['/api/events'],
  about: ['/api/about'],
  cricketTournaments: ['/api/cricket/tournaments', '/api/ctournaments', '/api/c-tournaments'],
  cricketBanner: ['/api/cricket/banner', '/api/cricket-banner', '/api/c-cricket-banner'],
  footballTournaments: ['/api/football/tournaments'],
  footballMatches: ['/api/football/matches'],
  badmintonTournaments: ['/api/badminton/tournaments', '/api/table-tennis/tournaments'],
  notices: ['/api/notices', '/api/notice'],
  team: ['/api/team', '/api/teams']
};

const SPORTS = {
  cricket: { label: 'Cricket', link: '/sports/cricket', color: '#22C55E', Icon: Zap },
  football: { label: 'Football', link: '/sports/football', color: '#F97316', Icon: Activity },
  badminton: { label: 'Badminton', link: '/sports/table-tennis', color: '#A78BFA', Icon: Award }
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

/* ----------------------------- helpers ----------------------------- */
const unwrap = (d) => {
  if (Array.isArray(d)) return d;
  if (!d || typeof d !== 'object') return [];
  const inner = d.data || d.items || d.tournaments || d.matches || d.notices || d.events || d.members || d.departments || d.results;
  return Array.isArray(inner) ? inner : [];
};
const fetchRaw = async (paths) => {
  for (const p of paths) { try { const r = await API.get(p); return r.data; } catch (e) { /* next */ } }
  return null;
};
const fetchList = async (paths) => { const raw = await fetchRaw(paths); return raw === null ? null : unwrap(raw); };
const matchStatus = (v) => { const x = String(v || '').toLowerCase(); return x === 'live' || x === 'ongoing' ? 'live' : x === 'completed' || x === 'finished' ? 'completed' : 'upcoming'; };
const tournamentStatus = (v) => { const x = String(v || '').toLowerCase(); return x === 'ongoing' || x === 'live' ? 'ongoing' : x === 'completed' || x === 'finished' ? 'completed' : 'upcoming'; };
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const teamName = (t) => (typeof t === 'string' ? t : t?.name || t?.teamName || 'TBD');
const cricketCategoryLink = (c) => (c === 'franchise_tournament' ? '/sports/cricket/franchise-schedule' : c === 'central_tournament' ? '/sports/cricket/central-schedule' : '/sports/cricket/inter-schedule');
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const deptName = (d) => (typeof d === 'string' ? d : d?.name || d?.title || d?.departmentName || d?.department || '');
const STATUS_ORDER = { ongoing: 0, upcoming: 1, completed: 2 };
const STATUS_LABEL = { ongoing: 'Ongoing', upcoming: 'Upcoming', completed: 'Completed' };

/* ------------------------- small components ------------------------ */
const Rv = ({ as: Tag = 'div', i = 0, v = '', className = '', children, ...rest }) => (
  <Tag className={`rv ${v ? `rv-${v}` : ''} ${className}`} style={{ '--i': i }} {...rest}>{children}</Tag>
);

const CountUp = ({ value, loading }) => {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setSeen(true); return undefined; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (loading || !seen) return undefined;
    const target = Number(value) || 0;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === 0) { setN(target); return undefined; }
    let raf; let start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 1000, 1);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, loading, seen]);
  return <span ref={ref}>{loading ? '–' : n}</span>;
};

/* Auto-running marquee. Nijei cholte thake + page scroll korle scroll er direction/speed onujayi
   aro druto cholte thake (scroll up korle ulta). Hover/touch e pause hoy. */
const Marquee = ({ items, render, speed = 38, reverse = false, boost = 0.6, gap = 16 }) => {
  const track = useRef(null);
  const pause = useRef(false);
  const vis = useRef(true);
  const base = items.length === 0 ? [] : items.length < 5 ? Array.from({ length: Math.ceil(5 / items.length) }).flatMap(() => items) : items;
  const loop = [...base, ...base];

  useEffect(() => {
    const el = track.current;
    if (!el || base.length === 0) return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { vis.current = e.isIntersecting; }, { rootMargin: '200px' }) : null;
    if (io) io.observe(el);
    let x = 0; let last = performance.now(); let lastY = window.scrollY; let raf;
    const dir = reverse ? 1 : -1;
    const tick = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05); last = t;
      const y = window.scrollY; const dy = y - lastY; lastY = y;
      const half = el.scrollWidth / 2;
      if (vis.current && half > 0 && !reduce) {
        if (!pause.current) x += dir * speed * dt;
        x += dir * Math.max(-120, Math.min(120, dy)) * boost;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        el.style.transform = `translate3d(${x}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); if (io) io.disconnect(); };
  }, [base.length, speed, reverse, boost]);

  return (
    <div
      className="mq overflow-hidden"
      onMouseEnter={() => { pause.current = true; }}
      onMouseLeave={() => { pause.current = false; }}
      onTouchStart={() => { pause.current = true; }}
      onTouchEnd={() => { pause.current = false; }}
    >
      <div ref={track} className="flex w-max will-change-transform">
        {loop.map((it, i) => (
          <div key={i} className="shrink-0" style={{ paddingRight: gap }} aria-hidden={i >= base.length ? 'true' : undefined}>{render(it)}</div>
        ))}
      </div>
    </div>
  );
};

const SectionHead = ({ title, sub, to, cta }) => (
  <Rv className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-6 sm:mb-9">
    <div className="min-w-0 max-w-2xl">
      <h2 className={`fd text-[2rem] sm:text-5xl font-bold leading-none text-[var(--ink)]`}>{title}</h2>
      <span className="hd-bar block h-1 w-14 rounded-full mt-4"></span>
      {sub && <p className={`text-sm sm:text-base mt-3 b-mute`}>{sub}</p>}
    </div>
    {to && (
      <Link to={to} className={`nudge inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold shrink-0 b-acc hover:underline`}>
        {cta || 'View all'} <ArrowRight className="w-4 h-4 nudge-i" />
      </Link>
    )}
  </Rv>
);

const MatchCard = ({ m }) => {
  const sp = SPORTS[m.sport];
  const Ic = sp.Icon;
  const started = m.status !== 'upcoming';
  return (
    <Link to={m.link} className="mc block w-[280px] sm:w-[320px] rounded-2xl p-4 text-[var(--ink)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold b-mute"><Ic className="w-3.5 h-3.5" /> {sp.label}</span>
        {m.status === 'live' ? (
          <span className="live-chip"><i></i> Live</span>
        ) : (
          <span className="text-xs font-semibold b-mute">{m.status === 'completed' ? `Full time · ${fmtDate(m.date)}` : `${fmtDate(m.date)}${m.time ? ` · ${m.time}` : ''}`}</span>
        )}
      </div>
      {m.tournament && <p className="text-xs b-mute truncate mb-2">{m.tournament}</p>}
      {[[m.home, m.scoreHome], [m.away, m.scoreAway]].map(([name, sc], k) => (
        <div key={k} className="flex items-center justify-between gap-3 py-1.5">
          <span className="fd text-xl font-semibold truncate">{name}</span>
          {started && <span className="text-sm font-bold tabular-nums text-[var(--ink)] shrink-0">{sc}</span>}
        </div>
      ))}
      <p className="text-xs mt-2 h-4 truncate b-mute font-medium">{m.note}</p>
    </Link>
  );
};

const TourCard = ({ t }) => {
  const sp = SPORTS[t.sport];
  const Ic = sp.Icon;
  return (
    <Link to={t.link} className="tc block w-[250px] sm:w-[290px] rounded-2xl p-4 sm:p-5 b-surf border b-line">
      <div className="flex items-center justify-between gap-3">
        <span className="w-10 h-10 rounded-xl grid place-items-center bg-[var(--fill)] text-[var(--on-fill)]"><Ic className="w-5 h-5" /></span>
        <span className={`st st-${t.status}`}>{STATUS_LABEL[t.status]}</span>
      </div>
      <h3 className="fd text-xl font-bold mt-4 leading-tight line-clamp-2 min-h-[2.5rem] text-[var(--ink)]">{t.name}</h3>
      <p className="text-xs b-mute mt-3">{sp.label}{t.date ? ` · ${fmtDate(t.date)}` : ''}</p>
    </Link>
  );
};

const EventCard = ({ ev, onOpen, i, big }) => (
  <Rv as="article" v="z" i={i} className={`min-w-0 ${big ? 'lg:col-span-2' : ''}`}>
    <button onClick={() => onOpen(ev)} className={`lift w-full h-full text-left rounded-2xl b-surf border b-line overflow-hidden flex flex-col ${big ? 'lg:flex-row' : ''} cursor-pointer`}>
      <div className={`b-surf2 overflow-hidden grid place-items-center shrink-0 aspect-[16/10] ${big ? 'lg:aspect-auto lg:w-1/2 lg:min-h-[300px]' : ''}`}>
        {ev.imageUrl ? <img src={ev.imageUrl} alt={ev.title} loading="lazy" className="lift-img w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 b-mute" aria-hidden="true" />}
      </div>
      <div className="p-4 sm:p-6 flex flex-col gap-3 flex-1 min-w-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm b-mute">
          <span className="flex items-center gap-1.5 min-w-0"><Calendar className="w-3.5 h-3.5 b-acc shrink-0" /><span className="truncate">{ev.date}</span></span>
          <span className="flex items-center gap-1.5 min-w-0"><MapPin className="w-3.5 h-3.5 b-acc shrink-0" /><span className="truncate">{ev.location}</span></span>
        </div>
        <h3 className={`fd font-bold leading-tight text-[var(--ink)] line-clamp-2 ${big ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>{ev.title}</h3>
        <p className={`text-sm b-mute leading-relaxed ${big ? 'line-clamp-4' : 'line-clamp-2'}`}>{ev.description}</p>
        <span className="nudge mt-auto inline-flex items-center gap-2 text-sm font-semibold b-acc">View details <ArrowRight className="w-4 h-4 nudge-i" /></span>
      </div>
    </button>
  </Rv>
);

const Person = ({ m }) => (
  <div className="pc h-full text-center rounded-2xl px-3 py-4 w-[140px] sm:w-[176px]">
    <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24">
      <img src={m.img || FALLBACK_IMG} alt={m.name} loading="lazy" className="w-full h-full rounded-full object-cover border-2 border-[var(--line)]" />
    </div>
    <p className="font-bold leading-tight mt-3 line-clamp-2 break-words text-[var(--ink)] text-xs sm:text-sm">{m.name}</p>
    <p className="font-semibold leading-tight mt-1 line-clamp-2 break-words b-mute text-[11px] sm:text-xs">{m.role}</p>
    {(m.designation || m.dept) && <p className="hidden sm:block text-[11px] b-mute opacity-70 mt-1 line-clamp-1">{m.designation || m.dept}</p>}
  </div>
);

/* ----------------------------- page -------------------------------- */
const Home = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const [slide, setSlide] = useState(0);
  const [ov, setOv] = useState({ cricket: null, footballTours: null, footballMatches: null, badminton: null, notices: null, events: null, team: null, about: null, banner: null });
  const [ovLoading, setOvLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState('all');
  const [showAllJourney, setShowAllJourney] = useState(false);

  const rootRef = useRef(null);
  const offsetRef = useRef(0);
  const ioRef = useRef(null);
  const barRef = useRef(null);
  const heroImgRef = useRef(null);
  const [pullUp, setPullUp] = useState(0);

  useEffect(() => {
    API.get('/api/club/content')
      .then((res) => { if (res.data) setContent(res.data); })
      .catch((err) => console.error('Error fetching content:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [cricket, footballTours, footballMatches, badminton, notices, events, team, about, bannerRaw] = await Promise.all([
        fetchList(ENDPOINTS.cricketTournaments), fetchList(ENDPOINTS.footballTournaments), fetchList(ENDPOINTS.footballMatches),
        fetchList(ENDPOINTS.badmintonTournaments), fetchList(ENDPOINTS.notices), fetchList(ENDPOINTS.events),
        fetchList(ENDPOINTS.team), fetchRaw(ENDPOINTS.about), fetchRaw(ENDPOINTS.cricketBanner)
      ]);
      if (!alive) return;
      const banner = Array.isArray(bannerRaw) ? (bannerRaw.find((b) => b.isActive) || bannerRaw[0] || null) : (bannerRaw && typeof bannerRaw === 'object' ? bannerRaw : null);
      setOv({ cricket, footballTours, footballMatches, badminton, notices, events, team, about: about && typeof about === 'object' && !Array.isArray(about) ? about : null, banner });
      setOvLoading(false);
    };
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  /* fixed header er jonno parent padding cancel kore hero ke upore tane */
  useEffect(() => { offsetRef.current = pullUp; }, [pullUp]);
  useEffect(() => {
    const measure = () => {
      const el = rootRef.current;
      if (!el) return;
      setPullUp(Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY + offsetRef.current)));
    };
    measure();
    const t = setTimeout(measure, 300);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [loading, content]);

  /* scroll progress bar + hero parallax */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
        if (heroImgRef.current && window.scrollY < window.innerHeight) heroImgRef.current.style.transform = `translate3d(0, ${window.scrollY * 0.18}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [loading, content]);

  /* scroll reveal */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const pending = root.querySelectorAll('.rv:not(.in)');
    if (!('IntersectionObserver' in window)) { pending.forEach((el) => el.classList.add('in')); return undefined; }
    if (!ioRef.current) {
      ioRef.current = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting || en.boundingClientRect.top < 0) { en.target.classList.add('in'); ioRef.current.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px 12% 0px', threshold: 0.01 });
    }
    pending.forEach((el) => ioRef.current.observe(el));
    const safety = setTimeout(() => {
      root.querySelectorAll('.rv:not(.in)').forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight * 1.4) el.classList.add('in'); });
    }, 2000);
    return () => clearTimeout(safety);
  }, [loading, content, ovLoading, ov, sportFilter, showAllJourney]);
  useEffect(() => () => { if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null; } }, []);

  useEffect(() => {
    if (!modalItem) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setModalItem(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [modalItem]);

  const defaultBanners = [{
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c6232660102?auto=format&fit=crop&w=1920&q=80',
    title: content?.clubTitle || 'BRIU Sports Club',
    subtitle: 'Unleashing athletic excellence, fostering discipline, and building the future champions.',
    link: '/news'
  }];
  const activeBanners = content?.banners && content.banners.length > 0 ? content.banners : defaultBanners;

  useEffect(() => {
    const t = setInterval(() => setSlide((p) => (p + 1) % activeBanners.length), 5000);
    return () => clearInterval(t);
  }, [activeBanners.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="flex items-center gap-4 text-[#0D2B75]" style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}>
          <div className="w-9 h-9 border-[3px] border-[#0D2B75] border-t-transparent rounded-full animate-spin shrink-0"></div>
          <span className="text-base font-medium">Loading club content…</span>
        </div>
      </div>
    );
  }
  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4" style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl border border-[#E4E4E7] px-8 py-7 text-center max-w-md w-full">
          <p className="text-[#0D2B75] font-bold mb-2 text-xl">Connection error</p>
          <span className="text-sm text-[#52525B]">Content could not be loaded from the server. Check the backend connection and reload.</span>
        </div>
      </div>
    );
  }

  const currentBanner = activeBanners[slide] || activeBanners[0];

  /* ---------------- committee: Team collection (/api/team), category = moderator + executive ---------------- */
  const catOf = (m) => String(m.category || '').toLowerCase();
  const norm = (m) => ({ name: m.name, role: m.role, dept: m.dept, designation: m.designation, img: m.img });
  const teamAll = ov.team || [];
  const teamMod = teamAll.find((m) => catOf(m) === 'moderator');
  const teamExec = teamAll.filter((m) => catOf(m) === 'executive');
  const fromTeam = !!teamMod || teamExec.length > 0;
  const cMod = fromTeam
    ? (teamMod ? norm(teamMod) : null)
    : (content.moderator?.name ? { name: content.moderator.name, role: content.moderator.role || content.moderator.designation || 'Moderator', dept: content.moderator.dept, img: content.moderator.image } : null);
  const cList = fromTeam ? teamExec.map(norm) : (Array.isArray(content.members) ? content.members.map(norm) : []);
  const cAll = [...(cMod ? [cMod] : []), ...cList];
  const ROWS = 3;
  const perRow = Math.max(1, Math.ceil(cAll.length / ROWS));
  const committeeRows = Array.from({ length: ROWS }, (_, r) => cAll.slice(r * perRow, (r + 1) * perRow)).filter((r) => r.length > 0);
  const committeeTotal = cAll.length;

  /* ---------------- overview data ---------------- */
  const cricketTours = (ov.cricket || []).map((t) => ({ id: t._id, sport: 'cricket', name: t.tournamentName, status: tournamentStatus(t.status), date: t.date, link: cricketCategoryLink(t.category), raw: t }));
  const footballTours = (ov.footballTours || []).map((t) => ({ id: t._id, sport: 'football', name: t.name, status: tournamentStatus(t.status), date: t.startDate, link: '/sports/football/schedule' }));
  const badmintonTours = (ov.badminton || []).map((t) => ({ id: t._id, sport: 'badminton', name: t.name, status: tournamentStatus(t.status), date: t.startDate, link: t._id ? `/sports/table-tennis/schedule/${t._id}` : '/sports/table-tennis/tournament' }));
  const toursBySport = { cricket: cricketTours, football: footballTours, badminton: badmintonTours };
  const availability = { cricket: ov.cricket !== null, football: ov.footballTours !== null, badminton: ov.badminton !== null };

  const cricketMatches = cricketTours.flatMap((t) => (t.raw.schedules || []).map((s) => {
    const st = matchStatus(s.status);
    const started = st !== 'upcoming';
    return {
      key: `c-${t.id}-${s._id}`, sport: 'cricket', status: st, date: s.date, time: '', tournament: t.name, home: s.team1, away: s.team2,
      scoreHome: started ? `${s.team1Score || '0/0'} (${s.team1Overs || '0.0'})` : '', scoreAway: started ? `${s.team2Score || '0/0'} (${s.team2Overs || '0.0'})` : '',
      note: st === 'completed' ? (s.outcome?.summary || s.result || '') : '', link: s._id ? `/sports/cricket/match/${s._id}` : '/sports/cricket'
    };
  }));
  const footballMatches = (ov.footballMatches || []).map((m) => {
    const st = matchStatus(m.status);
    const started = st !== 'upcoming';
    return {
      key: `f-${m._id}`, sport: 'football', status: st, date: m.date, time: m.time || '', tournament: m.tournament?.name || m.round || '',
      home: teamName(m.teamA), away: teamName(m.teamB), scoreHome: started ? String(m.scoreA ?? 0) : '', scoreAway: started ? String(m.scoreB ?? 0) : '',
      note: st === 'live' && m.minute ? `${m.minute}'` : '', link: '/sports/football/schedule'
    };
  });
  const everyMatch = [...cricketMatches, ...footballMatches];
  const shownMatches = everyMatch.filter((m) => sportFilter === 'all' || m.sport === sportFilter);
  const byDate = (a, b) => new Date(a.date || 0) - new Date(b.date || 0);
  const liveMatches = shownMatches.filter((m) => m.status === 'live');
  const upcomingMatches = shownMatches.filter((m) => m.status === 'upcoming').sort(byDate).slice(0, 12);
  const resultMatches = shownMatches.filter((m) => m.status === 'completed').sort((a, b) => byDate(b, a)).slice(0, 12);
  const rowOne = [...liveMatches, ...upcomingMatches];

  const allTours = [...cricketTours, ...footballTours, ...badmintonTours].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const ongoingTours = allTours.filter((t) => t.status === 'ongoing').length;
  const totalLive = everyMatch.filter((m) => m.status === 'live').length;
  const totalUpcoming = everyMatch.filter((m) => m.status === 'upcoming').length;

  const notices = [...(ov.notices || [])]
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  const allEvents = [...(ov.events || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const latestEvents = allEvents.slice(0, 4);
  const headlines = (ov.banner?.latestHeadlines || []).filter((h) => h.title).slice(0, 4);
  const hasHeadlines = headlines.length > 0;

  const teamList = ov.team || [];
  const teamGroups = Object.entries(teamList.reduce((acc, m) => { const k = (m.category || 'general').toLowerCase(); acc[k] = (acc[k] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const about = ov.about;
  const journey = about?.detailsSections || [];
  const journeyShown = showAllJourney ? journey : journey.slice(0, 3);
  const departments = unwrap(content.departments).filter((d) => deptName(d));

  const openEventModal = (ev) => setModalItem({ title: ev.title, description: ev.description, date: ev.date, location: ev.location, image: ev.imageUrl });

  return (
    <div ref={rootRef} style={pullUp ? { marginTop: -pullUp } : undefined} className={`briu min-h-screen ${content.flashNews ? 'pb-14' : ''} relative overflow-x-hidden`}>
      <div ref={barRef} className="fixed top-0 left-0 right-0 h-[3px] z-[80] origin-left bg-white mix-blend-difference" style={{ transform: 'scaleX(0)' }} aria-hidden="true"></div>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-neutral-800 text-white min-h-[560px] sm:min-h-[640px] h-[90svh] max-h-[900px] flex items-end">
        <div ref={heroImgRef} className="absolute inset-x-0 -top-10 -bottom-10 -z-10 will-change-transform">
          {activeBanners.map((b, idx) => (
            <img key={idx} src={b.imageUrl || b.bannerImage} alt="" className={`hero-img absolute inset-0 w-full h-full object-cover ${idx === slide ? 'on' : ''}`} />
          ))}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,14,28,.55) 0%, rgba(8,14,28,.35) 45%, rgba(8,14,28,.8) 100%)' }}></div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 pt-36 pb-24 sm:pb-28">
          {totalLive > 0 && (
            <Link to="#matches" onClick={(e) => { e.preventDefault(); document.getElementById('matches')?.scrollIntoView({ behavior: 'smooth' }); }} className="rise inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur px-4 py-2 text-sm font-semibold mb-6">
              <span className="live-chip"><i></i> Live</span> {totalLive} match{totalLive > 1 ? 'es' : ''} in play
            </Link>
          )}
          <p className="rise flex items-center gap-3 text-sm sm:text-base text-white/85 mb-4 font-medium">
            <span className="block h-[2px] w-8 bg-[#2563eb]"></span>Brahmaputra International University Sports Club
          </p>
          <h1 className="rise fd font-bold leading-[.95] max-w-4xl text-[clamp(3rem,9vw,7rem)]" style={{ animationDelay: '.1s' }}>
            {currentBanner.title || content.clubTitle || 'BRIU Sports Club'}
          </h1>
          <p className="rise text-white/75 text-base sm:text-lg max-w-xl leading-relaxed mt-5" style={{ animationDelay: '.2s' }}>
            {currentBanner.subtitle || 'Unleashing athletic excellence, fostering discipline, and building the future champions of Brahmaputra International University.'}
          </p>
          <div className="rise mt-8 flex flex-col sm:flex-row gap-3" style={{ animationDelay: '.3s' }}>
            {currentBanner.link ? (
              <a href={currentBanner.link} className="btn-gold">Explore more <ArrowRight className="w-4 h-4" /></a>
            ) : (
              <Link to="/sports/cricket" className="btn-gold">Explore Cricket <ArrowRight className="w-4 h-4" /></Link>
            )}
            <Link to="/founders" className="btn-ghost">Founders panel</Link>
          </div>
          {activeBanners.length > 1 && (
            <div className="flex items-center gap-4 mt-9">
              <div className="flex items-center gap-2">
                {activeBanners.map((_, idx) => (
                  <button key={idx} onClick={() => setSlide(idx)} aria-label={`Go to slide ${idx + 1}`} className={`h-[4px] rounded-full transition-all duration-500 ${slide === idx ? 'w-14 bg-[#3b82f6]' : 'w-6 bg-white/30 hover:bg-white/60'}`} />
                ))}
              </div>
              <span className="text-sm text-white/60 tabular-nums">{slide + 1} / {activeBanners.length}</span>
            </div>
          )}
        </div>
      </section>

      {/* EXECUTIVE COMMITTEE: moderator + executive, sobai serially 3 line e running */}
      {committeeTotal > 0 && (
        <section id="committee" aria-label="Executive committee" className="cm-panel relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16">
            <SectionHead title={content.committeeHeader || 'Executive Committee 2026'} sub={`${committeeTotal} members serving the club this season. Hover or touch a row to pause.`} />
          </div>
          {committeeRows.length > 0 && (
            <div className="relative mt-2 pb-12 sm:pb-16 space-y-3 sm:space-y-4">
              {committeeRows.map((row, r) => (
                <Marquee key={r} items={row} speed={24 + r * 3} reverse={r % 2 === 1} boost={0.5} gap={12} render={(m) => <Person m={m} />} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* MATCH CENTER (dark panel, auto running + scroll linked) */}
      <section id="matches" className="band band-b" aria-label="Match center">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHead title="Match center" sub="Live scores, fixtures and results keep running. Scroll and they move with you; hover or touch to pause." />
          <Rv className="no-scrollbar flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-8" role="tablist" aria-label="Filter by sport">
            {[['all', 'All sports'], ['cricket', 'Cricket'], ['football', 'Football']].map(([key, label]) => (
              <button key={key} role="tab" aria-selected={sportFilter === key} onClick={() => setSportFilter(key)}
                className={`chip shrink-0 min-h-[44px] px-5 rounded-full text-sm font-semibold border cursor-pointer ${sportFilter === key ? 'bg-[var(--fill)] text-[var(--on-fill)] border-[var(--fill)]' : 'b-surf b-line text-[var(--ink)]'}`}>
                {label}
              </button>
            ))}
          </Rv>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-4 flex items-center gap-2 text-sm font-semibold b-mute">
          <Radio className="w-4 h-4 b-mute" /> Live and upcoming
        </div>
        {ovLoading ? (
          <p className="px-4 py-8 text-sm b-mute text-center">Loading matches…</p>
        ) : rowOne.length === 0 ? (
          <p className="px-4 py-8 text-sm b-mute text-center">No live or upcoming matches{sportFilter !== 'all' ? ' for this sport' : ''}.</p>
        ) : (
          <Marquee key={`a-${sportFilter}`} items={rowOne} speed={42} render={(m) => <MatchCard m={m} />} />
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 mb-4 flex items-center gap-2 text-sm font-semibold b-mute">
          <Trophy className="w-4 h-4 b-mute" /> Latest results
        </div>
        {ovLoading ? null : resultMatches.length === 0 ? (
          <p className="px-4 py-6 text-sm b-mute text-center">No completed matches yet.</p>
        ) : (
          <Marquee key={`b-${sportFilter}`} items={resultMatches} speed={34} reverse render={(m) => <MatchCard m={m} />} />
        )}
        <p className="text-xs b-mute text-center mt-6 px-4">Badminton matches are listed on the Badminton page.</p>
      </section>

      {/* TOURNAMENTS */}
      <section id="tournaments" className="band band-w">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHead title="Sports and tournaments" sub="Every sport the club runs, and the tournaments on now." />
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-5 mb-8">
            {Object.entries(SPORTS).map(([key, s], i) => {
              const tours = toursBySport[key];
              const ongoing = tours.filter((t) => t.status === 'ongoing').length;
              return (
                <Rv key={key} i={i} className="min-w-0">
                  <Link to={s.link} className="sport-tile lift flex items-center gap-4 rounded-2xl p-4 sm:p-5 h-full" >
                    <span className="w-12 h-12 rounded-xl grid place-items-center shrink-0 bg-[var(--fill)] text-[var(--on-fill)]"><s.Icon className="w-6 h-6" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="fd block text-2xl font-bold leading-tight">{s.label}</span>
                      <span className="block text-sm b-mute">{ovLoading ? 'Loading…' : availability[key] ? `${tours.length} tournaments, ${ongoing} ongoing` : 'Data unavailable'}</span>
                    </span>
                    <ArrowRight className="w-5 h-5 shrink-0" />
                  </Link>
                </Rv>
              );
            })}
          </div>
        </div>
        <div aria-label="Tournaments">
        {ovLoading ? (
          <p className="px-4 py-8 text-sm b-mute text-center">Loading tournaments…</p>
        ) : allTours.length === 0 ? (
          <p className="px-4 py-8 text-sm b-mute text-center">No tournaments created yet.</p>
        ) : (
          <Marquee items={allTours} speed={32} reverse boost={0.7} render={(t) => <TourCard t={t} />} />
        )}
        </div>
      </section>

      <div>

        {/* EVENTS */}
        <section id="events" className="band band-b"><div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHead title="Events" sub="Championships, workshops and tournaments hosted by the club." to="/events" cta="All events" />
          {ovLoading ? (
            <p className="text-sm b-mute py-8 text-center rounded-2xl b-surf border b-line">Loading events…</p>
          ) : latestEvents.length === 0 ? (
            <p className="text-sm b-mute py-8 text-center rounded-2xl b-surf border b-line">{ov.events === null ? 'Events could not be loaded.' : 'No events published yet.'}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {latestEvents.map((ev, idx) => <EventCard key={ev._id} ev={ev} onOpen={openEventModal} i={idx} big={idx === 0 && latestEvents.length > 1} />)}
            </div>
          )}
        </div></section>

        {/* NEWS */}
        <section id="news" className="band band-w"><div className={`max-w-7xl mx-auto px-4 sm:px-8 grid gap-8 lg:gap-10 ${hasHeadlines ? 'lg:grid-cols-2' : ''}`}>
          <div className="min-w-0">
            <SectionHead title="Notice board" to="/notice/general" cta="All notices" />
            <Rv className="rounded-2xl b-surf border b-line overflow-hidden">
              {ovLoading ? (
                <p className="px-5 py-8 text-sm b-mute text-center">Loading notices…</p>
              ) : notices.length === 0 ? (
                <p className="px-5 py-8 text-sm b-mute text-center">{ov.notices === null ? 'Notices could not be loaded.' : 'No notices published yet.'}</p>
              ) : notices.map((n, idx) => (
                <Link key={n._id} to="/notice/general" style={{ '--i': idx }} className="rv rv-l flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 border-b b-line last:border-b-0 hover:bg-[var(--surf2)]">
                  <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${n.isPinned ? 'bg-[var(--fill)] text-[var(--on-fill)]' : 'bg-[var(--surf2)] text-[var(--ink)]'}`}>
                    {n.isPinned ? <Pin className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--ink)] leading-snug">{n.title}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs b-mute">
                      <span className="font-medium">{n.category || 'General'}</span>
                      <span>{fmtDate(n.publishDate || n.createdAt)}</span>
                      {n.isPinned && <span className="font-semibold b-acc">Pinned</span>}
                    </span>
                  </span>
                </Link>
              ))}
            </Rv>
          </div>
          {hasHeadlines && (
            <div className="min-w-0">
              <SectionHead title={ov.banner?.headlinesHeading || 'Cricket headlines'} to="/sports/cricket" cta={ov.banner?.moreNewsButtonText || 'More news'} />
              <Rv i={1} className="rounded-2xl b-surf border b-line overflow-hidden">
                {headlines.map((h, idx) => (
                  <Link key={idx} to="/sports/cricket" style={{ '--i': idx }} className="rv rv-r flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 border-b b-line last:border-b-0 hover:bg-[var(--surf2)]">
                    <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-[var(--surf2)] text-[var(--ink)]"><Newspaper className="w-4 h-4" /></span>
                    <span className="min-w-0 flex-1">
                      {h.category && <span className="block text-xs font-semibold b-mute mb-0.5">{h.category}</span>}
                      <span className="block font-semibold text-[var(--ink)] leading-snug">{h.title}</span>
                      {h.description && <span className="block text-sm b-mute mt-1 line-clamp-2">{h.description}</span>}
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs b-mute">
                        {h.author && <span>{h.author}</span>}
                        {(h.date || h.time) && <span>{[h.date, h.time].filter(Boolean).join(' ')}</span>}
                      </span>
                    </span>
                  </Link>
                ))}
              </Rv>
            </div>
          )}
        </div></section>

        {/* ABOUT */}
        <section id="about" className="band band-b"><div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHead title={about?.title ? `About ${about.title}` : 'About the club'} sub={about?.subtitle || about?.description} to="/about-us" cta="Full profile" />
          {(about?.mission || about?.vision) && (
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 mb-5">
              {about.mission && (
                <Rv v="l" className="rounded-2xl p-6 sm:p-8 bg-white text-[#0D2B75] flex flex-col gap-8 min-w-0">
                  <span className="w-11 h-11 rounded-xl border border-black/20 grid place-items-center"><Target size={20} /></span>
                  <div><h3 className="fd text-3xl font-bold">Our mission</h3><p className="text-sm sm:text-base leading-relaxed text-[#0D2B75]/75 mt-3 break-words">{about.mission}</p></div>
                </Rv>
              )}
              {about.vision && (
                <Rv v="r" i={1} className="rounded-2xl p-6 sm:p-8 bg-[var(--surf2)] border b-line text-[var(--ink)] flex flex-col gap-8 min-w-0">
                  <span className="w-11 h-11 rounded-xl border b-line grid place-items-center"><Compass size={20} /></span>
                  <div><h3 className="fd text-3xl font-bold">Our vision</h3><p className="text-sm sm:text-base leading-relaxed b-mute mt-3 break-words">{about.vision}</p></div>
                </Rv>
              )}
            </div>
          )}
          {about?.features && about.features.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl bg-[var(--line)] border b-line overflow-hidden mb-5">
              {about.features.map((f, idx) => (
                <Rv key={idx} i={idx} className="b-surf px-4 sm:px-6 py-5 sm:py-6 min-w-0">
                  <p className="fd text-3xl sm:text-4xl font-bold text-[var(--deep)] break-words">{f.title}</p>
                  <p className="text-sm b-mute mt-2">{f.subtitle}</p>
                </Rv>
              ))}
            </div>
          )}
          <Rv className="grid lg:grid-cols-12 gap-6 lg:gap-12 rounded-2xl b-surf border b-line p-5 sm:p-8 lg:p-10">
            <div className="lg:col-span-5 min-w-0">
              <span className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-[var(--fill)] text-[var(--on-fill)] mb-4"><Trophy className="w-6 h-6" /></span>
              <h3 className="flex items-center gap-2.5 text-sm font-semibold b-mute mb-3"><Target className="w-4 h-4 b-acc" /> Our objective</h3>
              <p className="fd text-2xl sm:text-3xl font-semibold leading-snug text-[var(--ink)]">{content.objective || 'Promoting sports and physical fitness among students.'}</p>
            </div>
            <div id="activities" className="lg:col-span-7 min-w-0">
              <h3 className="flex items-center gap-2.5 text-sm font-semibold b-mute mb-3"><Activity className="w-4 h-4 b-acc" /> Major activities</h3>
              <ul className="border-t b-line">
                {content.activities && content.activities.length > 0 ? content.activities.map((act, idx) => (
                  <li key={idx} style={{ '--i': idx }} className="rv rv-l act-row flex items-center justify-between gap-4 py-3.5 border-b b-line text-base font-medium text-[var(--ink)]">
                    <span className="break-words min-w-0">{act}</span><ArrowRight className="w-4 h-4 shrink-0 b-acc act-arrow" />
                  </li>
                )) : <li className="py-3.5 border-b b-line text-base font-medium">Annual Sports Tournament</li>}
              </ul>
            </div>
          </Rv>
          {journey.length > 0 && (
            <div className="mt-10">
              <Rv><h3 className="fd text-3xl font-bold text-[var(--ink)] mb-5">Our journey</h3></Rv>
              <ol className="relative border-l-2 b-line ml-2 sm:ml-3 space-y-5 sm:space-y-6">
                {journeyShown.map((sec, idx) => (
                  <Rv as="li" key={sec.id || idx} v="l" i={idx} className="pl-5 sm:pl-8 relative">
                    <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[var(--fill)] border-4 border-[var(--band)]"></span>
                    <div className="rounded-2xl b-surf border b-line p-4 sm:p-6 grid md:grid-cols-[1fr_260px] gap-4 sm:gap-6 items-start">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold b-acc">{sec.heading}</p>
                        <h4 className="fd text-2xl font-bold leading-snug text-[var(--ink)] mt-1">{sec.subheading}</h4>
                        <p className="text-sm sm:text-base b-mute leading-relaxed mt-2 break-words">{sec.text}</p>
                      </div>
                      {sec.imageUrl && <div className="b-surf2 rounded-xl overflow-hidden border b-line"><img src={sec.imageUrl} alt={sec.subheading || 'Journey visual'} loading="lazy" className="w-full h-44 md:h-40 object-cover" /></div>}
                    </div>
                  </Rv>
                ))}
              </ol>
              {journey.length > 3 && (
                <button onClick={() => setShowAllJourney((v) => !v)} className="chip mt-5 min-h-[44px] inline-flex items-center gap-2 px-5 rounded-full b-surf border b-line text-sm font-semibold cursor-pointer">
                  {showAllJourney ? 'Show fewer milestones' : `Show all ${journey.length} milestones`}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllJourney ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div></section>

        {/* DEPARTMENTS (nijer structure, alada component lagbe na) */}
        <section id="departments" className="band band-w"><div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHead title="Departments" sub="Each department runs its own teams, practice and fixtures." />
          {departments.length === 0 ? (
            <p className="text-sm b-mute py-8 text-center rounded-2xl b-surf border b-line">No departments added yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-[var(--line)] border b-line">
              {departments.map((d, idx) => {
                const name = deptName(d);
                const img = typeof d === 'object' ? d.image || d.imageUrl || d.logo : '';
                const desc = typeof d === 'object' ? d.description || d.about || d.head : '';
                return (
                  <Rv key={`${name}-${idx}`} i={idx % 8} v="z" className="dept b-surf p-4 sm:p-6 min-w-0 flex flex-col gap-3 min-h-[120px] sm:min-h-[160px]">
                    {img ? <img src={img} alt="" loading="lazy" className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-cover" /> : <span className="dept-mark fd">{name.trim().charAt(0).toUpperCase()}</span>}
                    <h3 className="fd text-lg sm:text-2xl font-bold leading-tight text-[var(--ink)] break-words">{name}</h3>
                    {desc && <p className="text-xs sm:text-sm b-mute line-clamp-2 break-words">{desc}</p>}
                  </Rv>
                );
              })}
            </div>
          )}
        </div></section>

        {/* TEAM */}
        <section id="team" className="band band-b"><div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHead title="Our team" sub="The people behind each division of the club." to="/team" cta="Meet the team" />
          <Rv className="rounded-2xl b-surf border b-line p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
            <div className="flex items-center gap-4 shrink-0">
              <span className="w-14 h-14 rounded-2xl bg-[var(--fill)] text-[var(--on-fill)] grid place-items-center"><Users className="w-7 h-7" /></span>
              <div>
                <p className="fd text-5xl font-bold text-[var(--ink)] tabular-nums leading-none"><CountUp value={teamList.length} loading={ovLoading} /></p>
                <p className="text-sm b-mute mt-1">team members</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 min-w-0">
              {ovLoading ? <span className="text-sm b-mute">Loading team…</span>
                : teamGroups.length === 0 ? <span className="text-sm b-mute">{ov.team === null ? 'Team data could not be loaded.' : 'No team members added yet.'}</span>
                : teamGroups.map(([cat, count]) => (
                  <Link key={cat} to="/team" className="chip min-h-[40px] inline-flex items-center gap-2 px-4 rounded-full b-surf2 border b-line text-sm font-semibold text-[var(--ink)]">
                    {capitalize(cat)} <span className="b-acc tabular-nums">{count}</span>
                  </Link>
                ))}
            </div>
          </Rv>
        </div></section>
      </div>

      {/* EVENT MODAL */}
      {modalItem && (
        <div className="modal-back fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModalItem(null)}>
          <div role="dialog" aria-modal="true" aria-label="Event details" onClick={(e) => e.stopPropagation()}
            className="modal-card relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto b-surf rounded-t-3xl sm:rounded-2xl shadow-2xl border b-line p-5 sm:p-8 custom-scrollbar text-[var(--ink)]">
            <div className="flex items-center justify-between pb-4 border-b b-line mb-5">
              <h3 className="fd text-2xl font-bold">Event details</h3>
              <button onClick={() => setModalItem(null)} aria-label="Close" className="w-11 h-11 grid place-items-center rounded-full hover:bg-[var(--surf2)] transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5">
              {modalItem.image && <div className="rounded-xl overflow-hidden b-surf2 border b-line"><img src={modalItem.image} alt={modalItem.title || 'Event banner'} className="w-full h-auto max-h-[300px] object-contain" /></div>}
              <div className="space-y-3">
                <h4 className="fd text-3xl sm:text-4xl font-bold leading-tight">{modalItem.title}</h4>
                <p className="leading-relaxed b-mute whitespace-pre-line break-words">{modalItem.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modalItem.date && (
                  <div className="flex items-center gap-3 p-4 rounded-xl b-surf2 border b-line"><Calendar className="w-5 h-5 b-acc shrink-0" /><div className="min-w-0"><p className="text-xs b-mute">Date</p><p className="text-sm font-semibold">{modalItem.date}</p></div></div>
                )}
                {modalItem.location && (
                  <div className="flex items-center gap-3 p-4 rounded-xl b-surf2 border b-line"><MapPin className="w-5 h-5 b-acc shrink-0" /><div className="min-w-0"><p className="text-xs b-mute">Location</p><p className="text-sm font-semibold">{modalItem.location}</p></div></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer id="footer" className="ft w-full pt-12 sm:pt-16 pb-8 px-4 sm:px-8 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-8 md:gap-10">
            <Rv className="md:col-span-5 min-w-0">
              <h3 className="fd text-4xl sm:text-5xl font-bold leading-none break-words">{content.contact?.companyName || content.clubTitle || 'Club Info'}</h3>
              <p className="b-mute leading-relaxed max-w-md mt-4">{content.contact?.shortDescription || content.objective || 'Empowering members through sports and physical fitness.'}</p>
            </Rv>
            <Rv i={1} className="md:col-span-4 min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--acc)] mb-4">Find us</h4>
              <div className="space-y-3 text-sm sm:text-base text-[var(--ink)]">
                <p className="flex items-start gap-3"><MapPin size={16} className="text-[var(--acc)] shrink-0 mt-1" /><span className="break-words min-w-0">{content.contact?.address || content.address || 'N/A'}</span></p>
                <p className="flex items-center gap-3"><Mail size={16} className="text-[var(--acc)] shrink-0" /><span className="break-all min-w-0">{content.contact?.email || content.email || 'N/A'}</span></p>
                <p className="flex items-center gap-3"><Phone size={16} className="text-[var(--acc)] shrink-0" /><span className="break-all min-w-0">{content.contact?.phone || content.phone || 'N/A'}</span></p>
              </div>
            </Rv>
            <Rv i={2} className="md:col-span-3 min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--acc)] mb-4">Follow us</h4>
              <div className="flex flex-wrap gap-2.5">
                {content.contact?.socialLinks && content.contact.socialLinks.length > 0 ? content.contact.socialLinks.map((s, idx) => (
                  <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="min-h-[44px] inline-flex items-center px-4 rounded-full border b-line text-sm hover:bg-[var(--fill)] hover:text-[var(--on-fill)] hover:border-transparent transition font-medium">{s.platform}</a>
                )) : <span className="text-sm b-mute">No social links added yet.</span>}
              </div>
            </Rv>
          </div>
          <div className="mt-10 pt-6 border-t b-line text-sm b-mute">
            {content.contact?.copyright || `© ${new Date().getFullYear()} ${content.clubTitle || 'Club'}.`}
          </div>
        </div>
      </footer>

      {/* FLASH NEWS */}
      {content.flashNews && (
        <div className="fn fixed bottom-0 inset-x-0 backdrop-blur-xl text-sm pt-2.5 px-3 sm:px-8 flex items-center gap-3 sm:gap-4 z-50 border-t" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
          <span className="bg-[var(--fill)] text-[var(--on-fill)] font-bold px-3 py-1 rounded-full text-xs shrink-0 z-10 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 fill-current shrink-0" /> Live news</span>
          <div className="w-full overflow-hidden whitespace-nowrap relative"><div className="inline-block animate-marquee b-mute">{content.flashNews}</div></div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap');
        html { scroll-behavior: smooth; scroll-padding-top: 6rem; }
        body { overflow-x: hidden; }

        .briu {
          --bg: #FFFFFF; --surf: #FFFFFF; --surf2: #F4F4F5; --ink: #09090B; --mute: #52525B; --line: #E4E4E7;
          --acc: #0D2B75; --deep: #0D2B75; --band: #FFFFFF; --fill: #0D2B75; --on-fill: #FFFFFF;
          font-family: 'Barlow', ui-sans-serif, system-ui, sans-serif; color: var(--ink);
          background: #fff; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;
        }
        .briu .fd { font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif; letter-spacing: .005em; }
        .briu .b-surf { background: var(--surf); } .briu .b-surf2 { background: var(--surf2); }
        .briu .b-line { border-color: var(--line); } .briu .b-mute { color: var(--mute); } .briu .b-acc { color: var(--acc); }
        .briu p, .briu h1, .briu h2, .briu h3, .briu h4 { overflow-wrap: break-word; }
        .briu img { max-width: 100%; }
        .briu a:focus-visible, .briu button:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }
        .briu .no-scrollbar { scrollbar-width: none; } .briu .no-scrollbar::-webkit-scrollbar { display: none; }

        .briu .btn-gold, .briu .btn-ghost { min-height: 48px; padding: 0 1.75rem; border-radius: 9999px; font-weight: 600; font-size: .95rem; display: inline-flex; align-items: center; justify-content: center; gap: .5rem; transition: transform .25s ease, background-color .25s ease; }
        .briu .btn-gold { background: #2563eb; color: #fff; box-shadow: 0 12px 30px -12px rgba(37,99,235,.8); } .briu .btn-gold:hover { transform: translateY(-2px); background: #1d4ed8; }
        .briu .btn-ghost { background: rgba(15,23,42,.45); border: 1px solid rgba(255,255,255,.22); color: #fff; backdrop-filter: blur(8px); } .briu .btn-ghost:hover { background: rgba(255,255,255,.12); }

        .hero-img { opacity: 0; transform: scale(1.06); transition: opacity 1s ease, transform 7s ease-out; }
        .hero-img.on { opacity: 1; transform: scale(1); }
        .rise { animation: rise .8s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

        .briu .rv { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); transition-delay: calc(min(var(--i, 0), 8) * 50ms); }
        .briu .rv-l { transform: translate3d(-30px, 0, 0); } .briu .rv-r { transform: translate3d(30px, 0, 0); }
        .briu .rv-z { transform: translate3d(0, 16px, 0) scale(.95); }
        .briu .rv.in { opacity: 1; transform: none; }

        .briu .lift { transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease; }
        .briu .lift:hover { transform: translateY(-4px); box-shadow: 0 22px 40px -24px rgba(0,0,0,.28); }
        .briu .lift .lift-img { transition: transform .8s cubic-bezier(.2,.8,.2,1); } .briu .lift:hover .lift-img { transform: scale(1.06); }
        .briu .nudge .nudge-i { transition: transform .25s ease; } .briu .nudge:hover .nudge-i { transform: translateX(5px); }
        .briu .chip { transition: border-color .25s ease, color .25s ease, background-color .25s ease; }
        .briu .chip:hover { border-color: var(--acc); color: var(--acc); }
        .act-row .act-arrow { opacity: 0; transform: translateX(-8px); transition: all .25s ease; } .act-row:hover .act-arrow { opacity: 1; transform: none; }

        /* marquee */
        .briu .mq { mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent); }

        /* scoreboard strip */
        .briu .mc { background: var(--surf); border: 1px solid var(--line); border-top: 3px solid var(--fill); transition: transform .25s ease, box-shadow .25s ease; }
        .briu .mc:hover { transform: translateY(-3px); box-shadow: 0 18px 32px -22px rgba(13,43,117,.35); }
        .briu .tc { border-top: 3px solid var(--fill); transition: transform .3s ease, box-shadow .3s ease; }
        .briu .tc:hover { transform: translateY(-4px); box-shadow: 0 20px 36px -22px rgba(0,0,0,.3); }
        .briu .st { font-size: .72rem; font-weight: 600; padding: .25rem .65rem; border-radius: 9999px; }
        .briu .st-ongoing { background: var(--fill); color: var(--on-fill); } .briu .st-upcoming { border: 1px solid var(--fill); color: var(--fill); } .briu .st-completed { background: var(--surf2); color: var(--mute); }
        .briu .live-chip { display: inline-flex; align-items: center; gap: .4rem; background: var(--fill); color: var(--on-fill); font-size: .7rem; font-weight: 700; padding: .2rem .6rem; border-radius: 9999px; }
        .briu .live-chip i { width: 6px; height: 6px; border-radius: 9999px; background: #DC2626; animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(1.5); } }
        .briu .sport-tile { background: var(--surf); color: var(--ink); border: 1px solid var(--line); }

        /* committee */
        .briu .cm-panel { background: #fff; }
        .briu .cm-orb { position: absolute; width: 360px; height: 360px; right: -100px; top: -120px; border-radius: 9999px; background: rgba(167,139,250,.28); filter: blur(70px); pointer-events: none; animation: float 10s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-30px,26px,0); } }
        .briu .pc { background: var(--surf2); border: 1px solid var(--line); transition: transform .3s ease, border-color .3s ease; }
        .briu .hd-bar { background: var(--fill); }
        .briu .band { padding: 3.5rem 0; } @media (min-width: 640px) { .briu .band { padding: 5rem 0; } }
        .briu .band-w { background: #fff; --band: #fff; }
        .briu .band-b { background: #F5F6F8; --band: #F5F6F8; --surf: #FFFFFF; --surf2: #ECEEF3; }
        .briu .navlink { transition: background-color .25s ease, color .25s ease; } .briu .navlink:hover { background: var(--surf2); color: var(--acc); }
        .briu .pc:hover { border-color: var(--ink); transform: translateY(-3px); }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* departments */
        .briu .dept { transition: background-color .3s ease; }
        .briu .dept:hover { background: var(--surf2); }
        .briu .dept-mark { width: 2.75rem; height: 2.75rem; border-radius: .85rem; display: grid; place-items: center; background: var(--fill); color: var(--on-fill); font-size: 1.5rem; font-weight: 700; }
        @media (min-width: 640px) { .briu .dept-mark { width: 3.5rem; height: 3.5rem; font-size: 1.9rem; } }

        .modal-back { animation: backIn .25s ease both; } .modal-card { animation: cardIn .45s cubic-bezier(.16,1,.3,1) both; }
        @keyframes backIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cardIn { from { opacity: 0; transform: translate3d(0, 40px, 0) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 25s linear infinite; will-change: transform; } .animate-marquee:hover { animation-play-state: paused; }
        .custom-scrollbar { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(120,120,120,.45); border-radius: 10px; }

        /* footer: dark navy */
        .briu .ft { --ink: #FFFFFF; --mute: #94A3B8; --line: rgba(255,255,255,.1); --acc: #3B82F6; --fill: #2563EB; --on-fill: #FFFFFF; background: #0B1325; color: #fff; border-top: 0; }
        .briu .ft h3 { color: #fff; }
        .briu .ft p, .briu .ft span { color: inherit; }
        .briu .ft .b-mute { color: #94A3B8; }

        /* live news bar: dark navy */
        .briu .fn { --ink: #FFFFFF; --mute: #E2E8F0; --line: rgba(255,255,255,.1); --fill: #2563EB; --on-fill: #FFFFFF; background: rgba(11,19,37,.97); color: #fff; border-color: rgba(255,255,255,.1); }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
          .briu .rv { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;