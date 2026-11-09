import React, { useEffect, useRef, useState } from 'react';
import API from '../services/api';
import { X } from 'lucide-react';

/* Home page er moto same design system: Barlow + Barlow Condensed, navy #0D2B75, white / #F5F6F8 band, dark navy hero + footer */

const Rv = ({ as: Tag = 'div', i = 0, v = '', className = '', children, ...rest }) => (
  <Tag className={`rv ${v ? `rv-${v}` : ''} ${className}`} style={{ '--i': i }} {...rest}>{children}</Tag>
);

const Team = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [darkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const rootRef = useRef(null);
  const offsetRef = useRef(0);
  const ioRef = useRef(null);
  const barRef = useRef(null);
  const [pullUp, setPullUp] = useState(0);

  useEffect(() => {
    API.get('/api/team')
      .then(res => {
        setMembers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching team:", err);
        setError("Failed to load team members.");
        setLoading(false);
      });
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
  }, [loading, error]);

  /* scroll progress bar */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [loading, error]);

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
  }, [loading, error, members]);
  useEffect(() => () => { if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null; } }, []);

  /* modal: Esc + body scroll lock */
  useEffect(() => {
    if (!selectedMember) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSelectedMember(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [selectedMember]);

  // ক্যাটাগরি দিয়ে প্রাইমারি ফিল্টারিং
  const moderator = members.find(m => m.category?.toLowerCase() === 'moderator');
  const executiveMembers = members.filter(m => m.category?.toLowerCase() === 'executive');
  const generalMembers = members.filter(m => m.category?.toLowerCase() === 'general');

  // নতুন যোগ করা ক্যাটাগরিগুলোর ফিল্টারিং
  const eSportsMembers = members.filter(m => m.category?.toLowerCase() === 'e-sports division');
  const athleticsMembers = members.filter(m => m.category?.toLowerCase() === 'athletics');
  const cricketMembers = members.filter(m => m.category?.toLowerCase() === 'cricket');
  const footballMembers = members.filter(m => m.category?.toLowerCase() === 'football');
  const badmintonMembers = members.filter(m => m.category?.toLowerCase() === 'badminton');
  const volleyballMembers = members.filter(m => m.category?.toLowerCase() === 'volleyball');
  const ludoMembers = members.filter(m => m.category?.toLowerCase() === 'ludo');
  const carromMembers = members.filter(m => m.category?.toLowerCase() === 'carrom');
  const chessMembers = members.filter(m => m.category?.toLowerCase() === 'chess');
  const tableTennisMembers = members.filter(m => m.category?.toLowerCase() === 'table tennis');
  const deadLiftMembers = members.filter(m => m.category?.toLowerCase() === 'dead lift');

  // এক্সিকিউটিভ ক্যাটাগরি থেকে বিশেষ ৩টি রোল আলাদা করা (President, Vice President, General Secretary)
  const president = executiveMembers.find(m => m.role?.toLowerCase().includes('president') && !m.role?.toLowerCase().includes('vice'));
  const vicePresident = executiveMembers.find(m => m.role?.toLowerCase().includes('vice president'));
  const generalSecretary = executiveMembers.find(m => m.role?.toLowerCase().includes('general secretary') || m.role?.toLowerCase().includes('gs'));

  // এই ৩টি পদের বাইরে বাকি এক্সিকিউটিভ মেম্বারগণ
  const otherExecutives = executiveMembers.filter(m =>
    m !== president && m !== vicePresident && m !== generalSecretary
  );

  // প্রথম সারির ৩ জনের স্পেশাল অ্যারে: ডেস্কটপ মোডে প্রেসিডেন্ট মাঝে [vicePresident, president, generalSecretary]
  const topRowExecutives = [vicePresident, president, generalSecretary].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="flex items-center gap-4 text-[#0D2B75]" style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}>
          <div className="w-9 h-9 border-[3px] border-[#0D2B75] border-t-transparent rounded-full animate-spin shrink-0"></div>
          <span className="text-base font-medium">Loading team members…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4" style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl border border-[#E4E4E7] px-8 py-7 text-center max-w-md w-full">
          <p className="text-[#0D2B75] font-bold mb-2 text-xl">Connection error</p>
          <span className="text-sm text-[#52525B]">{error}</span>
        </div>
      </div>
    );
  }

  // Sections rendered after the executive block, in the same order as before
  const sectionList = [
    ['executive-members', 'Executive Members', generalMembers],
    ['e-sports-division', 'E-Sports Division', eSportsMembers],
    ['athletics', 'Athletics', athleticsMembers],
    ['cricket', 'Cricket', cricketMembers],
    ['football', 'Football', footballMembers],
    ['badminton', 'Badminton', badmintonMembers],
    ['volleyball', 'Volleyball', volleyballMembers],
    ['ludo', 'Ludo', ludoMembers],
    ['carrom', 'Carrom', carromMembers],
    ['chess', 'Chess', chessMembers],
    ['table-tennis', 'Table Tennis', tableTennisMembers],
    ['dead-lift', 'Dead Lift', deadLiftMembers],
  ];

  const navItems = [
    ...(moderator ? [{ id: 'moderator', label: 'Moderator' }] : []),
    ...(executiveMembers.length > 0 ? [{ id: 'executive', label: 'Executive Committee' }] : []),
    ...sectionList.filter(([, , list]) => list.length > 0).map(([id, label]) => ({ id, label })),
  ];

  /* sections er background white / #F5F6F8 alternate hobe */
  let bandCounter = 0;
  const nextBand = () => (bandCounter++ % 2 === 0 ? 'band-w' : 'band-b');

  const sectionHead = (title, count) => (
    <Rv className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-8 sm:mb-10">
      <div className="min-w-0 max-w-3xl">
        <h2 className="fd text-[2rem] sm:text-5xl font-bold leading-none text-[var(--ink)]">{title}</h2>
        <span className="hd-bar block h-1 w-14 rounded-full mt-4"></span>
      </div>
      {count != null && <span className="text-sm font-semibold b-mute shrink-0">{count} {count === 1 ? 'member' : 'members'}</span>}
    </Rv>
  );

  const renderCard = (member, highlight = false) => (
    <button type="button" onClick={() => setSelectedMember(member)} className="tm-card lift group w-full text-left rounded-2xl b-surf border b-line overflow-hidden cursor-pointer block">
      <div className={`relative overflow-hidden aspect-[4/5] b-surf2 ${highlight ? 'tm-hl' : ''}`}>
        <img src={member.img} alt={member.name} loading="lazy" className="lift-img w-full h-full object-cover object-top" />
        <span className="tm-view text-xs font-semibold">View profile</span>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="fd text-xl sm:text-2xl font-bold leading-tight truncate text-[var(--ink)]">{member.name}</h3>
        <p className="text-sm font-semibold b-acc mt-1 truncate">{member.role}</p>
        <p className="text-sm b-mute mt-0.5 truncate">{member.dept}</p>
      </div>
    </button>
  );

  const gridCls = 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6';

  return (
    <div ref={rootRef} style={pullUp ? { marginTop: -pullUp } : undefined} className={`tm ${darkMode ? 'dark' : ''} min-h-screen w-full relative overflow-x-hidden`}>
      <div ref={barRef} className="fixed top-0 left-0 right-0 h-[3px] z-[80] origin-left bg-white mix-blend-difference" style={{ transform: 'scaleX(0)' }} aria-hidden="true"></div>

      {/* HERO */}
      <header className="relative isolate overflow-hidden bg-[#0B1325] text-white">
        <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(60% 90% at 88% 0%, rgba(37,99,235,.35), transparent 70%), linear-gradient(180deg, #0B1325 0%, #0B1325 100%)' }}></div>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-36 pb-16 sm:pb-24">
          <p className="rise flex items-center gap-3 text-sm sm:text-base text-white/85 mb-4 font-medium">
            <span className="block h-[2px] w-8 bg-[#2563eb]"></span>BRIU Sports Club
          </p>
          <h1 className="rise fd font-bold leading-[.95] max-w-4xl text-[clamp(3rem,9vw,7rem)]" style={{ animationDelay: '.1s' }}>
            Meet our team
          </h1>
          <div className="rise flex flex-col md:flex-row md:items-end justify-between gap-8 mt-6" style={{ animationDelay: '.2s' }}>
            <p className="text-white/75 max-w-xl text-base sm:text-lg leading-relaxed">
              The dedicated academic and student leaders driving excellence at BRIU Sports Club.
            </p>
            <dl className="flex gap-10">
              <div>
                <dd className="fd text-5xl font-bold leading-none tabular-nums">{members.length}</dd>
                <dt className="text-sm text-white/60 mt-1">Members</dt>
              </div>
              <div>
                <dd className="fd text-5xl font-bold leading-none tabular-nums">{navItems.length}</dd>
                <dt className="text-sm text-white/60 mt-1">Sections</dt>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* SECTION INDEX */}
      {navItems.length > 0 && (
        <nav className="tm-glass sticky top-[60px] z-30 border-b b-line" aria-label="Team sections">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {navItems.map(n => (
              <a key={n.id} href={`#${n.id}`} className="chip shrink-0 min-h-[40px] inline-flex items-center px-4 rounded-full b-surf2 border b-line text-sm font-semibold text-[var(--ink)] whitespace-nowrap">{n.label}</a>
            ))}
          </div>
        </nav>
      )}

      {/* 1. MODERATOR */}
      {moderator && (
        <section id="moderator" className={`band ${nextBand()}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {sectionHead('Club moderator')}
            <Rv v="z">
              <article className="tm-mod rounded-2xl b-surf border b-line p-4 sm:p-6 grid sm:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-5 sm:gap-8 items-center">
                <button type="button" onClick={() => setSelectedMember(moderator)} aria-label={`View profile of ${moderator.name}`} className="group block w-full max-w-[280px] mx-auto sm:mx-0 aspect-[4/5] rounded-xl overflow-hidden b-surf2 cursor-pointer">
                  <img src={moderator.img} alt={moderator.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                </button>

                <div className="min-w-0 sm:py-2 lg:pr-6">
                  <p className="text-sm font-semibold b-acc">{moderator.role || 'Moderator'}</p>
                  <h3 className="fd text-4xl sm:text-5xl font-bold leading-[1.02] mt-1 text-[var(--ink)]">{moderator.name}</h3>

                  <dl className="mt-6 border-t b-line text-sm sm:text-base">
                    <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-4 py-3 border-b b-line">
                      <dt className="b-mute">Designation</dt>
                      <dd className="font-medium min-w-0 break-words">{moderator.designation || 'Lecturer, Department Of Law'}</dd>
                    </div>
                    {moderator.dept && (
                      <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-4 py-3 border-b b-line">
                        <dt className="b-mute">Department</dt>
                        <dd className="font-medium min-w-0 break-words">{moderator.dept}</dd>
                      </div>
                    )}
                    <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-4 py-3 border-b b-line">
                      <dt className="b-mute">Organization</dt>
                      <dd className="font-medium min-w-0">BRIU Sports Club</dd>
                    </div>
                  </dl>

                  <button type="button" onClick={() => setSelectedMember(moderator)} className="mt-5 min-h-[44px] inline-flex items-center px-5 rounded-full border b-line text-sm font-semibold text-[var(--ink)] hover:border-[var(--acc)] hover:text-[var(--acc)] transition cursor-pointer">
                    View full profile
                  </button>
                </div>
              </article>
            </Rv>
          </div>
        </section>
      )}

      {/* 2. EXECUTIVE COMMITTEE */}
      {executiveMembers.length > 0 && (
        <section id="executive" className={`band ${nextBand()}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {sectionHead('Executive Committee', executiveMembers.length)}

            {topRowExecutives.length > 0 && (
              <div className="flex flex-col md:grid md:grid-cols-3 gap-8 lg:gap-10 max-w-5xl mx-auto items-end">
                {topRowExecutives.map((member, idx) => {
                  const isPresidentCenter = member === president;

                  let mobileOrderClass = '';
                  if (member === president) {
                    mobileOrderClass = 'order-1 md:order-none';
                  } else if (member === vicePresident) {
                    mobileOrderClass = 'order-2 md:order-none';
                  } else if (member === generalSecretary) {
                    mobileOrderClass = 'order-3 md:order-none';
                  }

                  return (
                    <Rv key={member._id} i={idx} v="z" className={`w-full max-w-[340px] mx-auto ${mobileOrderClass} ${isPresidentCenter ? 'md:-translate-y-6 lg:-translate-y-10' : ''}`}>
                      {renderCard(member, isPresidentCenter)}
                    </Rv>
                  );
                })}
              </div>
            )}

            {otherExecutives.length > 0 && (
              <div className={`${gridCls} mt-16 sm:mt-20`}>
                {otherExecutives.map((member, idx) => (
                  <Rv key={member._id} i={idx % 8} v="z">{renderCard(member)}</Rv>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3+. GENERAL, E-SPORTS, ATHLETICS, CRICKET, FOOTBALL, BADMINTON, VOLLEYBALL, LUDO, CARROM, CHESS, TABLE TENNIS, DEAD LIFT */}
      {sectionList.map(([id, title, list]) => list.length > 0 && (
        <section key={id} id={id} className={`band ${nextBand()}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {sectionHead(title, list.length)}
            <div className={gridCls}>
              {list.map((member, idx) => (
                <Rv key={member._id} i={idx % 8} v="z">{renderCard(member)}</Rv>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* PROFILE MODAL */}
      {selectedMember && (
        <div className="modal-back fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMember(null)}>
          <div role="dialog" aria-modal="true" aria-label="Member profile" onClick={(e) => e.stopPropagation()}
            className="modal-card relative w-full sm:max-w-md max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto b-surf rounded-t-3xl sm:rounded-2xl shadow-2xl border b-line custom-scrollbar text-[var(--ink)]">
            <button
              onClick={() => setSelectedMember(null)}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-md grid place-items-center transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-72 sm:h-80 b-surf2">
              <img src={selectedMember.img} alt={selectedMember.name} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: 'linear-gradient(to top, var(--surf), transparent)' }}></div>
            </div>

            <div className="p-5 sm:p-8 -mt-4 relative space-y-6">
              <div>
                <h3 className="fd text-4xl sm:text-5xl font-bold leading-[.95]">{selectedMember.name}</h3>

                {selectedMember.category?.toLowerCase() === 'moderator' ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-semibold b-acc">{selectedMember.role}</p>
                    <p className="text-xs b-mute">BRIU Sports Club</p>
                    <p className="text-sm sm:text-base font-medium pt-1">
                      {selectedMember.designation || 'Lecturer, Department Of Law'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-semibold b-acc mt-3">{selectedMember.role}</p>
                )}
              </div>

              <dl className="border-t b-line text-sm">
                <div className="flex justify-between items-center gap-4 py-3.5 border-b b-line">
                  <dt className="b-mute">Category</dt>
                  <dd className="font-semibold">{selectedMember.category}</dd>
                </div>

                {selectedMember.category?.toLowerCase() !== 'moderator' && (
                  <div className="flex justify-between items-center gap-4 py-3.5 border-b b-line">
                    <dt className="b-mute">Department</dt>
                    <dd className="font-medium text-right max-w-[210px] truncate">{selectedMember.dept}</dd>
                  </div>
                )}

                <div className="flex justify-between items-center gap-4 py-3.5 border-b b-line">
                  <dt className="b-mute">Email</dt>
                  <dd className="font-medium b-acc truncate max-w-[210px]">{selectedMember.email || 'N/A'}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 py-3.5">
                  <dt className="b-mute">Phone</dt>
                  <dd className="font-medium">{selectedMember.phone || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap');
        html { scroll-behavior: smooth; scroll-padding-top: 8rem; }
        body { overflow-x: hidden; }

        .tm {
          --bg: #FFFFFF; --surf: #FFFFFF; --surf2: #F4F4F5; --ink: #09090B; --mute: #52525B; --line: #E4E4E7;
          --acc: #0D2B75; --deep: #0D2B75; --band: #FFFFFF; --fill: #0D2B75; --on-fill: #FFFFFF;
          font-family: 'Barlow', ui-sans-serif, system-ui, sans-serif; color: var(--ink);
          background: #fff; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;
        }
        .tm .fd { font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif; letter-spacing: .005em; }
        .tm .b-surf { background: var(--surf); } .tm .b-surf2 { background: var(--surf2); }
        .tm .b-line { border-color: var(--line); } .tm .b-mute { color: var(--mute); } .tm .b-acc { color: var(--acc); }
        .tm p, .tm h1, .tm h2, .tm h3, .tm h4 { overflow-wrap: break-word; }
        .tm img { max-width: 100%; }
        .tm a:focus-visible, .tm button:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }
        .tm .no-scrollbar { scrollbar-width: none; } .tm .no-scrollbar::-webkit-scrollbar { display: none; }

        .tm .hd-bar { background: var(--fill); }
        .tm .band { padding: 3.5rem 0; } @media (min-width: 640px) { .tm .band { padding: 5rem 0; } }
        .tm .band-w { background: #fff; --band: #fff; }
        .tm .band-b { background: #F5F6F8; --band: #F5F6F8; --surf: #FFFFFF; --surf2: #ECEEF3; }

        .tm .tm-glass { background: rgba(255,255,255,.92); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }
        .tm .chip { transition: border-color .25s ease, color .25s ease, background-color .25s ease; }
        .tm .chip:hover { border-color: var(--acc); color: var(--acc); }

        .rise { animation: rise .8s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

        .tm .rv { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); transition-delay: calc(min(var(--i, 0), 8) * 50ms); }
        .tm .rv-z { transform: translate3d(0, 16px, 0) scale(.95); }
        .tm .rv.in { opacity: 1; transform: none; }

        .tm .lift { transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease; }
        .tm .lift:hover { transform: translateY(-4px); box-shadow: 0 22px 40px -24px rgba(0,0,0,.28); }
        .tm .lift .lift-img { transition: transform .8s cubic-bezier(.2,.8,.2,1); } .tm .lift:hover .lift-img { transform: scale(1.06); }
        .tm .nudge { transition: gap .25s ease; } .tm .tm-card:hover .nudge { gap: 1rem; }

        .tm .tm-hl { box-shadow: inset 0 0 0 3px var(--fill); }
        .tm .tm-view { display: none; }
        @media (hover: hover) {
          .tm .tm-view { display: block; position: absolute; left: 50%; bottom: 16px; translate: -50% 12px; opacity: 0; background: #fff; color: #0D2B75; padding: 8px 16px; border-radius: 999px; white-space: nowrap; transition: all .35s cubic-bezier(.2,.7,.2,1); }
          .tm .tm-card:hover .tm-view { translate: -50% 0; opacity: 1; }
        }

        .modal-back { animation: backIn .25s ease both; } .modal-card { animation: cardIn .45s cubic-bezier(.16,1,.3,1) both; }
        @keyframes backIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cardIn { from { opacity: 0; transform: translate3d(0, 40px, 0) scale(.97); } to { opacity: 1; transform: none; } }
        .custom-scrollbar { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(120,120,120,.45); border-radius: 10px; }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
          .tm .rv { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Team;