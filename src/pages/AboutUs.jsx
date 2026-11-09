import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { Target, Compass, MapPin, Phone, Mail } from 'lucide-react';

/* Home page er moto same design system: Barlow + Barlow Condensed, navy #0D2B75, white / #F5F6F8 band, dark navy hero + footer */

const Rv = ({ as: Tag = 'div', i = 0, v = '', className = '', children, ...rest }) => (
  <Tag className={`rv ${v ? `rv-${v}` : ''} ${className}`} style={{ '--i': i }} {...rest}>{children}</Tag>
);

const SectionHead = ({ title, sub }) => (
  <Rv className="mb-6 sm:mb-9">
    <div className="min-w-0 max-w-2xl">
      <h2 className="fd text-[2rem] sm:text-5xl font-bold leading-none text-[var(--ink)]">{title}</h2>
      <span className="hd-bar block h-1 w-14 rounded-full mt-4"></span>
      {sub && <p className="text-sm sm:text-base mt-3 b-mute">{sub}</p>}
    </div>
  </Rv>
);

const AboutUs = () => {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [darkMode] = useState(false);

  const rootRef = useRef(null);
  const offsetRef = useRef(0);
  const ioRef = useRef(null);
  const barRef = useRef(null);
  const heroImgRef = useRef(null);
  const [pullUp, setPullUp] = useState(0);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const res = await API.get('/api/about');
      if (res.data) {
        setAbout(res.data);
      }
    } catch (err) {
      console.error('Error fetching about data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto slide effect for full-width banners
  useEffect(() => {
    if (about && about.banners && about.banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % about.banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [about]);

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
  }, [loading, about]);

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
  }, [loading, about]);

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
  }, [loading, about]);
  useEffect(() => () => { if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null; } }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="flex items-center gap-4 text-[#0D2B75]" style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}>
          <div className="w-9 h-9 border-[3px] border-[#0D2B75] border-t-transparent rounded-full animate-spin shrink-0"></div>
          <span className="text-base font-medium">Loading profile…</span>
        </div>
      </div>
    );
  }

  if (!about) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4" style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl border border-[#E4E4E7] px-8 py-7 text-center max-w-md w-full">
          <p className="text-[#0D2B75] font-bold mb-2 text-xl">Connection error</p>
          <span className="text-sm text-[#52525B]">Failed to load About Us data. Check the backend connection and reload.</span>
        </div>
      </div>
    );
  }

  const hasBanners = about.banners && about.banners.length > 0;
  const hasDescription = !!about.description;

  return (
    <div ref={rootRef} style={pullUp ? { marginTop: -pullUp } : undefined} className={`ab ${darkMode ? 'dark' : ''} min-h-screen relative overflow-x-hidden`}>
      <div ref={barRef} className="fixed top-0 left-0 right-0 h-[3px] z-[80] origin-left bg-white mix-blend-difference" style={{ transform: 'scaleX(0)' }} aria-hidden="true"></div>

      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden bg-[#0B1325] text-white min-h-[520px] sm:min-h-[600px] h-[80svh] max-h-[820px] flex items-end">
        <div ref={heroImgRef} className="absolute inset-x-0 -top-10 -bottom-10 -z-10 will-change-transform">
          {hasBanners && about.banners.map((src, idx) => (
            <img key={idx} src={src} alt="" className={`hero-img absolute inset-0 w-full h-full object-cover ${idx === currentBanner ? 'on' : ''}`} />
          ))}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,14,28,.55) 0%, rgba(8,14,28,.35) 45%, rgba(8,14,28,.8) 100%)' }}></div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 pt-36 pb-20 sm:pb-24">
          <p className="rise flex items-center gap-3 text-sm sm:text-base text-white/85 mb-4 font-medium">
            <span className="block h-[2px] w-8 bg-[#2563eb]"></span>Official Club Profile
          </p>
          <h1 className="rise fd font-bold leading-[.95] max-w-4xl text-[clamp(3rem,9vw,7rem)] break-words" style={{ animationDelay: '.1s' }}>
            {about.title}
          </h1>
          <p className="rise text-white/75 text-base sm:text-lg max-w-xl leading-relaxed mt-5" style={{ animationDelay: '.2s' }}>
            {about.subtitle || about.description}
          </p>
          {hasBanners && about.banners.length > 1 && (
            <div className="flex items-center gap-4 mt-9">
              <div className="flex items-center gap-2">
                {about.banners.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentBanner(idx)} aria-label={`Go to slide ${idx + 1}`} className={`h-[4px] rounded-full transition-all duration-500 ${currentBanner === idx ? 'w-14 bg-[#3b82f6]' : 'w-6 bg-white/30 hover:bg-white/60'}`} />
                ))}
              </div>
              <span className="text-sm text-white/60 tabular-nums">{currentBanner + 1} / {about.banners.length}</span>
            </div>
          )}
        </div>
      </section>

      {/* ============ OVERVIEW ============ */}
      {hasDescription && (
        <section className="band band-w">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <SectionHead title="Overview" sub={`Welcome to ${about.title}`} />
            <Rv className="rounded-2xl b-surf border b-line p-6 sm:p-10">
              <p className="fd text-2xl sm:text-4xl font-semibold leading-snug text-[var(--ink)] break-words">{about.description}</p>
            </Rv>
          </div>
        </section>
      )}

      {/* ============ MISSION & VISION ============ */}
      <section className="band band-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionHead title="Mission and vision" sub="What drives the club and where it is headed." />
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
            <Rv v="l" className="rounded-2xl p-6 sm:p-10 bg-white border b-line text-[#0D2B75] flex flex-col gap-10 min-w-0 md:min-h-[340px] justify-between">
              <span className="w-11 h-11 rounded-xl border border-black/20 grid place-items-center"><Target size={20} /></span>
              <div>
                <h3 className="fd text-3xl sm:text-4xl font-bold">Our mission</h3>
                <p className="text-sm sm:text-base leading-relaxed text-[#0D2B75]/75 mt-3 break-words">{about.mission}</p>
              </div>
            </Rv>
            <Rv v="r" i={1} className="rounded-2xl p-6 sm:p-10 bg-[#0D2B75] text-white flex flex-col gap-10 min-w-0 md:min-h-[340px] justify-between">
              <span className="w-11 h-11 rounded-xl border border-white/30 grid place-items-center"><Compass size={20} /></span>
              <div>
                <h3 className="fd text-3xl sm:text-4xl font-bold">Our vision</h3>
                <p className="text-sm sm:text-base leading-relaxed text-white/80 mt-3 break-words">{about.vision}</p>
              </div>
            </Rv>
          </div>
        </div>
      </section>

      {/* ============ NUMBERS ============ */}
      {about.features && about.features.length > 0 && (
        <section className="band band-w">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <SectionHead title="At a glance" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl bg-[var(--line)] border b-line overflow-hidden">
              {about.features.map((feat, index) => (
                <Rv key={index} i={index} className="b-surf px-4 sm:px-6 py-6 sm:py-8 min-w-0">
                  <p className="fd text-4xl sm:text-5xl font-bold text-[var(--deep)] break-words leading-none">{feat.title}</p>
                  <p className="text-sm b-mute mt-3">{feat.subtitle}</p>
                </Rv>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ JOURNEY ============ */}
      {about.detailsSections && about.detailsSections.length > 0 && (
        <section className="band band-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <SectionHead title="Our journey" sub="Milestones that shaped the club." />
            <ol className="relative border-l-2 b-line ml-2 sm:ml-3 space-y-5 sm:space-y-6">
              {about.detailsSections.map((sec, idx) => (
                <Rv as="li" key={sec.id || idx} v="l" i={idx % 6} className="pl-5 sm:pl-8 relative">
                  <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[var(--fill)] border-4 border-[var(--band)]"></span>
                  <div className="rounded-2xl b-surf border b-line p-4 sm:p-6 grid md:grid-cols-[1fr_300px] gap-4 sm:gap-6 items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold b-acc break-words">{sec.heading}</p>
                      <h3 className="fd text-2xl sm:text-3xl font-bold leading-snug text-[var(--ink)] mt-1 break-words">{sec.subheading}</h3>
                      <p className="text-sm sm:text-base b-mute leading-relaxed mt-2 break-words">{sec.text}</p>
                    </div>
                    {sec.imageUrl && (
                      <div className="b-surf2 rounded-xl overflow-hidden border b-line flex items-center justify-center">
                        <img src={sec.imageUrl} alt={sec.subheading || 'Journey visual'} loading="lazy" className="w-full h-48 md:h-44 object-contain" />
                      </div>
                    )}
                  </div>
                </Rv>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ============ FOOTER PANEL ============ */}
      <footer className="ft w-full pt-12 sm:pt-16 pb-8 px-4 sm:px-8 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-8 md:gap-10">
            <Rv className="md:col-span-5 min-w-0">
              <h3 className="fd text-4xl sm:text-5xl font-bold leading-none break-words">{about.contact?.companyName || about.title || 'Club Info'}</h3>
              <p className="b-mute leading-relaxed max-w-md mt-4">
                {about.contact?.shortDescription || about.subtitle || about.description || 'Empowering members through sports and physical fitness.'}
              </p>
            </Rv>
            <Rv i={1} className="md:col-span-4 min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--acc)] mb-4">Contact us</h4>
              <div className="space-y-3 text-sm sm:text-base text-[var(--ink)]">
                <p className="flex items-start gap-3"><MapPin size={16} className="text-[var(--acc)] shrink-0 mt-1" /><span className="break-words min-w-0">{about.contact?.address || 'N/A'}</span></p>
                <p className="flex items-center gap-3"><Mail size={16} className="text-[var(--acc)] shrink-0" /><span className="break-all min-w-0">{about.contact?.email || 'N/A'}</span></p>
                <p className="flex items-center gap-3"><Phone size={16} className="text-[var(--acc)] shrink-0" /><span className="break-all min-w-0">{about.contact?.phone || 'N/A'}</span></p>
              </div>
            </Rv>
            <Rv i={2} className="md:col-span-3 min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--acc)] mb-4">Follow us</h4>
              <div className="flex flex-wrap gap-2.5">
                {about.contact?.socialLinks && about.contact.socialLinks.length > 0 ? about.contact.socialLinks.map((s, idx) => (
                  <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="min-h-[44px] inline-flex items-center px-4 rounded-full border b-line text-sm hover:bg-[var(--fill)] hover:text-[var(--on-fill)] hover:border-transparent transition font-medium">{s.platform}</a>
                )) : <span className="text-sm b-mute">No social links added yet.</span>}
              </div>
            </Rv>
          </div>
          <div className="mt-10 pt-6 border-t b-line text-sm b-mute">
            {about.contact?.copyright || `© ${new Date().getFullYear()} ${about.title || 'Club'}. All rights reserved.`}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap');
        html { scroll-behavior: smooth; scroll-padding-top: 6rem; }
        body { overflow-x: hidden; }

        .ab {
          --bg: #FFFFFF; --surf: #FFFFFF; --surf2: #F4F4F5; --ink: #09090B; --mute: #52525B; --line: #E4E4E7;
          --acc: #0D2B75; --deep: #0D2B75; --band: #FFFFFF; --fill: #0D2B75; --on-fill: #FFFFFF;
          font-family: 'Barlow', ui-sans-serif, system-ui, sans-serif; color: var(--ink);
          background: #fff; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;
        }
        .ab .fd { font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif; letter-spacing: .005em; }
        .ab .b-surf { background: var(--surf); } .ab .b-surf2 { background: var(--surf2); }
        .ab .b-line { border-color: var(--line); } .ab .b-mute { color: var(--mute); } .ab .b-acc { color: var(--acc); }
        .ab p, .ab h1, .ab h2, .ab h3, .ab h4 { overflow-wrap: break-word; }
        .ab img { max-width: 100%; }
        .ab a:focus-visible, .ab button:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }

        .ab .hd-bar { background: var(--fill); }
        .ab .band { padding: 3.5rem 0; } @media (min-width: 640px) { .ab .band { padding: 5rem 0; } }
        .ab .band-w { background: #fff; --band: #fff; }
        .ab .band-b { background: #F5F6F8; --band: #F5F6F8; --surf: #FFFFFF; --surf2: #ECEEF3; }

        .hero-img { opacity: 0; transform: scale(1.06); transition: opacity 1s ease, transform 7s ease-out; }
        .hero-img.on { opacity: 1; transform: scale(1); }
        .rise { animation: rise .8s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

        .ab .rv { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); transition-delay: calc(min(var(--i, 0), 8) * 50ms); }
        .ab .rv-l { transform: translate3d(-30px, 0, 0); } .ab .rv-r { transform: translate3d(30px, 0, 0); }
        .ab .rv.in { opacity: 1; transform: none; }

        /* footer: dark navy */
        .ab .ft { --ink: #FFFFFF; --mute: #94A3B8; --line: rgba(255,255,255,.1); --acc: #3B82F6; --fill: #2563EB; --on-fill: #FFFFFF; background: #0B1325; color: #fff; border-top: 0; }
        .ab .ft h3 { color: #fff; }
        .ab .ft p, .ab .ft span { color: inherit; }
        .ab .ft .b-mute { color: #94A3B8; }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
          .ab .rv { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AboutUs;