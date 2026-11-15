import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Activity, Award, ArrowRight } from 'lucide-react';

const SPORTS = [
  { key: 'cricket', label: 'Cricket', to: '/sports/cricket', Icon: Zap, color: '#16A34A',
    text: 'Tournaments, live scores, point table, players and auction.' },
  { key: 'football', label: 'Football', to: '/sports/football', Icon: Activity, color: '#EA580C',
    text: 'Fixtures, live scores, point table, teams and auction.' },
  { key: 'badminton', label: 'Badminton', to: '/sports/table-tennis', Icon: Award, color: '#7C3AED',
    text: 'Tournaments, schedule, live matches and point table.' }
];

export default function Sports() {
  return (
    <div className="sp">
      <section className="sp-wrap">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
          <p className="sp-rise flex items-center gap-3 text-sm sm:text-base font-medium sp-mute mb-3">
            <span className="block h-[2px] w-8 bg-[#2563eb]" />BRIU Sports Club
          </p>
          <h1 className="sp-rise sp-fd text-[clamp(2.75rem,8vw,5.5rem)] font-bold leading-[.95] text-[#09090B]" style={{ animationDelay: '.08s' }}>
            Explore sports
          </h1>
          <span className="sp-rise block h-1 w-14 rounded-full mt-5 bg-[#0D2B75]" style={{ animationDelay: '.12s' }} />
          <p className="sp-rise sp-mute text-base sm:text-lg max-w-xl leading-relaxed mt-4" style={{ animationDelay: '.16s' }}>
            Choose a sport to see its tournaments, fixtures, live scores and standings.
          </p>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mt-10 sm:mt-14">
            {SPORTS.map(({ key, label, to, Icon, color, text }, i) => (
              <Link
                key={key}
                to={to}
                className="sp-card sp-rise group flex flex-col gap-6 rounded-2xl p-6 sm:p-7"
                style={{ '--c': color, animationDelay: `${0.2 + i * 0.08}s` }}
              >
                <span className="sp-icon w-14 h-14 rounded-2xl grid place-items-center text-white" style={{ background: color }}>
                  <Icon className="w-7 h-7" aria-hidden="true" />
                </span>
                <span className="block min-w-0">
                  <span className="sp-fd block text-4xl font-bold leading-none text-[#09090B]">{label}</span>
                  <span className="block text-sm sm:text-base sp-mute leading-relaxed mt-3">{text}</span>
                </span>
                <span className="sp-go mt-auto inline-flex items-center gap-2 text-sm font-semibold" style={{ color }}>
                  Open {label} <ArrowRight className="w-4 h-4 sp-arrow" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>

          <Link to="/" className="inline-flex items-center min-h-[44px] mt-10 text-sm font-semibold text-[#0D2B75] hover:underline">
            Back to home
          </Link>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap');
        .sp { font-family: 'Barlow', ui-sans-serif, system-ui, sans-serif; color: #09090B; -webkit-font-smoothing: antialiased; }
        .sp .sp-fd { font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif; letter-spacing: .005em; }
        .sp .sp-mute { color: #52525B; }
        .sp .sp-wrap { background: #F5F6F8; min-height: calc(100vh - 7rem); }
        .sp .sp-card { background: #fff; border: 1px solid #E4E4E7; border-top: 3px solid var(--c); transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease; }
        .sp .sp-card:hover { transform: translateY(-5px); box-shadow: 0 24px 40px -26px rgba(0,0,0,.35); }
        .sp .sp-card:focus-visible { outline: 2px solid var(--c); outline-offset: 3px; }
        .sp .sp-arrow { transition: transform .25s ease; }
        .sp .sp-card:hover .sp-arrow { transform: translateX(5px); }
        .sp .sp-rise { animation: sp-rise .7s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes sp-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .sp .sp-rise { animation: none; }
          .sp .sp-card, .sp .sp-arrow { transition: none; }
        }
      `}</style>
    </div>
  );
}