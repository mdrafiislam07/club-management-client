import React from 'react';

/*
  Full-page sports background  —  <SportsBackground dark={darkMode} />
  Pure CSS + inline SVG (no images, no canvas, no JS animation loop) => GPU transforms only, very light.

  Layers (back to front):
   1. Light / night gradient (cross-fades when dark mode toggles)
   2. Soft colour "aurora" blobs drifting slowly
   3. Stadium spotlight beams swaying from the top corners
   4. Badminton court in 3D perspective (lines draw themselves once)
   5. Rotating football centre-circle
   6. Twinkling stadium sparkles
   7. Floating line-art sports icons (shuttlecock, football, basketball, tennis, racket, bat, trophy)
   8. Shuttlecock rally (flies across the screen in arcs, flips direction)
   9. Bouncing basketball with squash & stretch
  10. Vignette
  Respects prefers-reduced-motion. Fewer elements on mobile.
*/

// [symbol, left %, size px, duration s, delay s, sway px, colour 1-5]
const ITEMS = [
  ['shuttle', 6, 46, 24, 0, 40, 1],
  ['football', 17, 40, 28, -9, -50, 2],
  ['bat', 29, 44, 26, -15, 30, 3],
  ['basket', 41, 42, 30, -5, -40, 5],
  ['racket', 53, 48, 25, -19, 50, 4],
  ['tennis', 64, 34, 29, -11, -30, 3],
  ['trophy', 75, 44, 31, -3, 40, 5],
  ['shuttle', 86, 38, 23, -21, -45, 2],
  ['football', 93, 32, 27, -13, 35, 1],
  ['racket', 11, 34, 33, -17, -35, 2],
  ['basket', 70, 30, 28, -7, 30, 4],
  ['bat', 48, 32, 32, -25, 45, 1],
];

// [left %, top %, size px, duration s, delay s]
const SPARKS = [
  [8, 10, 3, 4, 0], [22, 24, 2, 5, -2], [35, 8, 3, 6, -1], [47, 30, 2, 4.5, -3], [58, 12, 3, 5.5, -4],
  [70, 26, 2, 4, -1.5], [82, 9, 3, 6, -2.5], [92, 22, 2, 5, -0.5], [15, 44, 2, 5.5, -3.5], [38, 50, 3, 4.5, -1],
  [62, 46, 2, 6, -2], [78, 52, 3, 5, -4.5], [5, 62, 2, 4, -3], [95, 60, 3, 5.5, -1.2],
];

const CSS = `
.sbg{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0;contain:layout paint;
  --c1:#4f46e5;--c2:#0891b2;--c3:#059669;--c4:#db2777;--c5:#ea580c;
  --io:.17;--line:#6366f1;--lo:.30;--spark:#6366f1;--beam:rgba(99,102,241,.11);--vig:rgba(79,70,229,.10);
  --b1:rgba(99,102,241,.30);--b2:rgba(6,182,212,.24);--b3:rgba(16,185,129,.22)}
.sbg.dark{--c1:#a5b4fc;--c2:#67e8f9;--c3:#6ee7b7;--c4:#f9a8d4;--c5:#fdba74;
  --io:.24;--line:#818cf8;--lo:.34;--spark:#e0e7ff;--beam:rgba(165,180,252,.17);--vig:rgba(0,0,0,.55);
  --b1:rgba(99,102,241,.34);--b2:rgba(217,70,239,.22);--b3:rgba(16,185,129,.24)}
.sbg>*{position:absolute}
.sbg-base{inset:0;transition:opacity .7s ease}
.sbg-base.light{background:linear-gradient(160deg,#eef5ff 0%,#f4efff 48%,#e9fbf3 100%)}
.sbg-base.night{background:linear-gradient(160deg,#050816 0%,#0b1230 50%,#04140f 100%);opacity:0}
.sbg-base.night.on{opacity:1}

/* aurora blobs */
.sbg-blob{width:70vmax;height:70vmax;border-radius:50%;will-change:transform;
  background:radial-gradient(circle,var(--bc) 0%,transparent 65%)}
.sbg-blob.b1{--bc:var(--b1);left:-25vmax;top:-30vmax;animation:sbgDrift1 26s ease-in-out infinite alternate}
.sbg-blob.b2{--bc:var(--b2);right:-30vmax;top:10vmax;animation:sbgDrift2 32s ease-in-out infinite alternate}
.sbg-blob.b3{--bc:var(--b3);left:10vmax;bottom:-40vmax;animation:sbgDrift3 29s ease-in-out infinite alternate}
@keyframes sbgDrift1{to{transform:translate3d(18vmax,12vmax,0) scale(1.1)}}
@keyframes sbgDrift2{to{transform:translate3d(-22vmax,14vmax,0) scale(.92)}}
@keyframes sbgDrift3{to{transform:translate3d(20vmax,-12vmax,0) scale(1.08)}}

/* stadium spotlight beams */
.sbg-beam{top:-8vh;width:42vw;height:85vh;transform-origin:50% 0;will-change:transform;
  background:linear-gradient(to bottom,var(--beam),transparent 78%);
  clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}
.sbg-beam.l{left:-6vw;animation:sbgBeamL 10s ease-in-out infinite alternate}
.sbg-beam.r{right:-6vw;animation:sbgBeamR 12s ease-in-out infinite alternate}
@keyframes sbgBeamL{from{transform:rotate(-8deg)}to{transform:rotate(10deg)}}
@keyframes sbgBeamR{from{transform:rotate(8deg)}to{transform:rotate(-10deg)}}

/* shared icon style (symbols inherit through <use>) */
.sbg-ico{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;display:block}

/* badminton court */
.sbg-court{left:50%;bottom:-10%;width:min(150vw,1500px);height:auto;fill:none;stroke:var(--line);stroke-width:3;
  opacity:var(--lo);transform:translateX(-50%) perspective(800px) rotateX(62deg);transform-origin:50% 100%}
.sbg-ln{stroke-dasharray:1;stroke-dashoffset:1;animation:sbgDraw 3.2s ease-out forwards}
@keyframes sbgDraw{to{stroke-dashoffset:0}}

/* football centre circle */
.sbg-centre{right:-14vmin;top:-14vmin;width:58vmin;height:58vmin;fill:none;stroke:var(--line);stroke-width:2.5;
  opacity:calc(var(--lo)*.8);animation:sbgSpin 140s linear infinite}
@keyframes sbgSpin{to{transform:rotate(360deg)}}

/* sparkles */
.sbg-sp{border-radius:50%;background:var(--spark);opacity:0;animation:sbgTw var(--d) ease-in-out var(--l) infinite;
  box-shadow:0 0 8px 1px var(--spark)}
@keyframes sbgTw{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:.85;transform:scale(1)}}

/* floating icons */
.sbg-f{bottom:-90px;line-height:0;will-change:transform;opacity:var(--io);color:var(--c);
  animation:sbgFloat var(--d) linear var(--l) infinite}
@keyframes sbgFloat{
  0%{transform:translate3d(0,0,0) rotate(0deg)}
  50%{transform:translate3d(var(--x),-60vh,0) rotate(160deg)}
  100%{transform:translate3d(0,-125vh,0) rotate(340deg)}}

/* shuttlecock rally */
.sbg-rx{left:0;bottom:24%;will-change:transform;animation:sbgRx 12s linear infinite}
.sbg-ry{animation:sbgRy 6s infinite}
.sbg-rally{width:46px;height:46px;color:var(--c4);opacity:calc(var(--io) + .12);animation:sbgRr 12s linear infinite}
@keyframes sbgRx{0%{transform:translate3d(-10vw,0,0)}50%{transform:translate3d(105vw,0,0)}100%{transform:translate3d(-10vw,0,0)}}
@keyframes sbgRy{
  0%{transform:translateY(0);animation-timing-function:cubic-bezier(.2,.7,.4,1)}
  50%{transform:translateY(-22vh);animation-timing-function:cubic-bezier(.6,0,.8,.3)}
  100%{transform:translateY(0)}}
@keyframes sbgRr{0%{transform:rotate(-135deg)}49.99%{transform:rotate(-45deg)}50%{transform:rotate(135deg)}100%{transform:rotate(45deg)}}

/* bouncing basketball */
.sbg-bx{left:0;bottom:1.5%;will-change:transform;animation:sbgBx 30s linear infinite}
.sbg-by{transform-origin:50% 100%;animation:sbgBy 1.5s infinite}
.sbg-ball{width:40px;height:40px;color:var(--c5);opacity:calc(var(--io) + .12);animation:sbgSpinF 3s linear infinite}
@keyframes sbgBx{from{transform:translate3d(-8vw,0,0)}to{transform:translate3d(105vw,0,0)}}
@keyframes sbgBy{
  0%{transform:translateY(0) scale(1.12,.88);animation-timing-function:cubic-bezier(.3,.6,.5,1)}
  50%{transform:translateY(-26vh) scale(1,1);animation-timing-function:cubic-bezier(.5,0,.7,.4)}
  100%{transform:translateY(0) scale(1.12,.88)}}
@keyframes sbgSpinF{to{transform:rotate(360deg)}}

.sbg-vig{inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,var(--vig) 100%)}

@media (max-width:640px){
  .sbg-f:nth-of-type(n+7){display:none}
  .sbg-sp:nth-of-type(n+9){display:none}
  .sbg-beam{width:70vw}
  .sbg-court{width:210vw}
}
@media (prefers-reduced-motion:reduce){
  .sbg *{animation:none!important}
  .sbg-ln{stroke-dashoffset:0}
  .sbg-f{bottom:auto;top:calc(var(--n)*7% + 8%)}
  .sbg-rx,.sbg-bx,.sbg-sp{display:none}
}
`;

const Ico = ({ id, size, className = '', style }) => (
  <svg className={`sbg-ico ${className}`} width={size} height={size} style={style} viewBox="0 0 64 64">
    <use href={`#sb-${id}`} />
  </svg>
);

export default function SportsBackground({ dark = false }) {
  return (
    <div className={`sbg ${dark ? 'dark' : ''}`} aria-hidden="true">
      <style>{CSS}</style>

      {/* icon library (defined once, reused with <use>) */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <symbol id="sb-shuttle" viewBox="0 0 64 64">
            <circle cx="32" cy="51" r="9" />
            <path d="M24 44 L12 10 M40 44 L52 10 M32 42 L32 8 M28 43 L22 9 M36 43 L42 9" />
            <path d="M12 10 Q32 2 52 10 M18 26 Q32 30 46 26" />
          </symbol>
          <symbol id="sb-football" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" />
            <path d="M32 20 L43 28 L39 41 L25 41 L21 28 Z" />
            <path d="M32 20 V6 M43 28 L56 24 M39 41 L47 52 M25 41 L17 52 M21 28 L8 24" />
          </symbol>
          <symbol id="sb-basket" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" />
            <path d="M6 32 H58 M32 6 V58 M13 13 Q27 32 13 51 M51 13 Q37 32 51 51" />
          </symbol>
          <symbol id="sb-tennis" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" />
            <path d="M10 14 Q26 32 10 50 M54 14 Q38 32 54 50" />
          </symbol>
          <symbol id="sb-racket" viewBox="0 0 64 64">
            <ellipse cx="32" cy="23" rx="17" ry="21" />
            <path d="M32 2 V44 M15 23 H49 M20 9 Q32 13 44 9 M20 37 Q32 33 44 37" />
            <rect x="29" y="44" width="6" height="17" rx="3" />
          </symbol>
          <symbol id="sb-bat" viewBox="0 0 64 64">
            <rect x="24" y="3" width="16" height="40" rx="5" />
            <path d="M32 9 V37" />
            <rect x="29" y="43" width="6" height="18" rx="3" />
          </symbol>
          <symbol id="sb-trophy" viewBox="0 0 64 64">
            <path d="M20 8 H44 V24 Q44 38 32 38 Q20 38 20 24 Z" />
            <path d="M20 12 H10 Q10 26 22 28 M44 12 H54 Q54 26 42 28" />
            <path d="M32 38 V50 M22 58 H42 M26 50 H38 V58 H26 Z" />
          </symbol>
        </defs>
      </svg>

      {/* 1. gradients (cross-fade on theme change) */}
      <div className="sbg-base light" />
      <div className={`sbg-base night ${dark ? 'on' : ''}`} />

      {/* 2. aurora */}
      <div className="sbg-blob b1" />
      <div className="sbg-blob b2" />
      <div className="sbg-blob b3" />

      {/* 3. spotlights */}
      <i className="sbg-beam l" />
      <i className="sbg-beam r" />

      {/* 4. badminton court (lines draw once) */}
      <svg className="sbg-court" viewBox="0 0 880 400">
        <rect className="sbg-ln" pathLength="1" x="20" y="20" width="840" height="360" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '.2s' }} d="M20 47 H860" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '.3s' }} d="M20 353 H860" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '.4s' }} d="M440 8 V392" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '.5s' }} d="M316 20 V380" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '.6s' }} d="M564 20 V380" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '.7s' }} d="M68 20 V380" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '.8s' }} d="M812 20 V380" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '.9s' }} d="M20 200 H316" />
        <path className="sbg-ln" pathLength="1" style={{ animationDelay: '1s' }} d="M564 200 H860" />
      </svg>

      {/* 5. football centre circle */}
      <svg className="sbg-centre" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="92" />
        <circle cx="100" cy="100" r="5" />
        <path d="M100 8 V192" />
        <path d="M8 100 H192" opacity=".5" />
      </svg>

      {/* 6. sparkles */}
      {SPARKS.map(([l, t, s, d, dl], i) => (
        <b key={i} className="sbg-sp" style={{ left: `${l}%`, top: `${t}%`, width: s, height: s, '--d': `${d}s`, '--l': `${dl}s` }} />
      ))}

      {/* 7. floating icons */}
      {ITEMS.map(([id, left, size, dur, delay, sway, c], n) => (
        <i key={n} className="sbg-f" style={{ left: `${left}%`, '--d': `${dur}s`, '--l': `${delay}s`, '--x': `${sway}px`, '--c': `var(--c${c})`, '--n': n }}>
          <Ico id={id} size={size} />
        </i>
      ))}

      {/* 8. shuttlecock rally */}
      <div className="sbg-rx">
        <div className="sbg-ry">
          <Ico id="shuttle" size={46} className="sbg-rally" />
        </div>
      </div>

      {/* 9. bouncing basketball */}
      <div className="sbg-bx">
        <div className="sbg-by">
          <Ico id="basket" size={40} className="sbg-ball" />
        </div>
      </div>

      {/* 10. vignette */}
      <div className="sbg-vig" />
    </div>
  );
}