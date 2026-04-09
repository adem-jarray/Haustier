/**
 * Background — Design A: Aurore Nordique
 * Vagues ondulantes vert + bleu-vert animées, avec grain subtil et doodles flottants
 */

const PawSVG = () => (
  <svg viewBox="0 0 60 60" fill="currentColor">
    <ellipse cx="30" cy="39" rx="14" ry="12" />
    <ellipse cx="13" cy="24" rx="6.5" ry="7.5" />
    <ellipse cx="25" cy="17" rx="6"   ry="7"   />
    <ellipse cx="38" cy="17" rx="6"   ry="7"   />
    <ellipse cx="50" cy="24" rx="6"   ry="7.5" />
  </svg>
);

const BoneSVG = () => (
  <svg viewBox="0 0 90 36" fill="currentColor">
    <circle cx="11"  cy="11"  r="10" />
    <circle cx="11"  cy="25"  r="10" />
    <circle cx="79"  cy="11"  r="10" />
    <circle cx="79"  cy="25"  r="10" />
    <rect x="16" y="12" width="58" height="12" rx="6" />
  </svg>
);

const FishSVG = () => (
  <svg viewBox="0 0 90 52" fill="currentColor">
    <polygon points="0,6 20,26 0,46" />
    <ellipse cx="54" cy="26" rx="34" ry="19" />
    <circle  cx="74" cy="20" r="5" fill="white" fillOpacity="0.45" />
  </svg>
);

const HeartSVG = () => (
  <svg viewBox="0 0 50 46" fill="currentColor">
    <path d="M25 43C25 43 3 28 3 15C3 8 8 3 15 3C19 3 23 5 25 8C27 5 31 3 35 3C42 3 47 8 47 15C47 28 25 43 25 43Z" />
  </svg>
);

const StarSVG = () => (
  <svg viewBox="0 0 50 50" fill="currentColor">
    <polygon points="25,3 31,18 47,18 34,29 39,45 25,35 11,45 16,29 3,18 19,18" />
  </svg>
);

const ButterflySVG = () => (
  <svg viewBox="0 0 70 50" fill="currentColor">
    <ellipse cx="18" cy="18" rx="17" ry="14" transform="rotate(-20 18 18)" fillOpacity="0.9" />
    <ellipse cx="52" cy="18" rx="17" ry="14" transform="rotate(20 52 18)"  fillOpacity="0.9" />
    <ellipse cx="14" cy="36" rx="12" ry="10" transform="rotate(-30 14 36)" fillOpacity="0.75"/>
    <ellipse cx="56" cy="36" rx="12" ry="10" transform="rotate(30 56 36)"  fillOpacity="0.75"/>
    <ellipse cx="35" cy="26" rx="4"  ry="14" />
  </svg>
);

const ShapeMap: Record<string, React.FC> = {
  paw: PawSVG, bone: BoneSVG, fish: FishSVG,
  heart: HeartSVG, star: StarSVG, butterfly: ButterflySVG,
};

const doodles = [
  { x: 3,   y: 6,   opacity: 0.10, scale: 1.30, rotate: -22,  size: 52,  shape: "paw",       dur: 13 },
  { x: 88,  y: 12,  opacity: 0.08, scale: 0.70, rotate:  47,  size: 44,  shape: "paw",       dur: 17 },
  { x: 22,  y: 52,  opacity: 0.09, scale: 1.55, rotate: -8,   size: 58,  shape: "paw",       dur: 15 },
  { x: 74,  y: 68,  opacity: 0.07, scale: 0.85, rotate:  63,  size: 46,  shape: "paw",       dur: 19 },
  { x: 47,  y: 87,  opacity: 0.09, scale: 1.10, rotate: -35,  size: 50,  shape: "paw",       dur: 14 },
  { x: 91,  y: 42,  opacity: 0.08, scale: 1.40, rotate:  18,  size: 54,  shape: "paw",       dur: 16 },
  { x: 6,   y: 78,  opacity: 0.07, scale: 0.65, rotate:  80,  size: 42,  shape: "paw",       dur: 20 },
  { x: 34,  y: 19,  opacity: 0.08, scale: 0.80, rotate:  38,  size: 68,  shape: "bone",      dur: 18 },
  { x: 78,  y: 58,  opacity: 0.07, scale: 1.20, rotate: -55,  size: 76,  shape: "bone",      dur: 22 },
  { x: 14,  y: 35,  opacity: 0.06, scale: 0.65, rotate:  12,  size: 60,  shape: "bone",      dur: 14 },
  { x: 58,  y: 74,  opacity: 0.08, scale: 1.00, rotate: -72,  size: 70,  shape: "bone",      dur: 17 },
  { x: 29,  y: 92,  opacity: 0.08, scale: 0.90, rotate: -14,  size: 64,  shape: "fish",      dur: 21 },
  { x: 69,  y: 8,   opacity: 0.09, scale: 0.75, rotate:  28,  size: 58,  shape: "fish",      dur: 16 },
  { x: 94,  y: 80,  opacity: 0.07, scale: 1.15, rotate:  -6,  size: 66,  shape: "fish",      dur: 13 },
  { x: 43,  y: 46,  opacity: 0.09, scale: 0.80, rotate:  15,  size: 40,  shape: "heart",     dur: 18 },
  { x: 83,  y: 30,  opacity: 0.07, scale: 0.55, rotate: -28,  size: 34,  shape: "heart",     dur: 15 },
  { x: 10,  y: 62,  opacity: 0.10, scale: 1.00, rotate:  42,  size: 44,  shape: "heart",     dur: 20 },
  { x: 60,  y: 4,   opacity: 0.08, scale: 0.60, rotate:  20,  size: 36,  shape: "star",      dur: 23 },
  { x: 2,   y: 25,  opacity: 0.09, scale: 0.80, rotate: -50,  size: 40,  shape: "star",      dur: 16 },
  { x: 51,  y: 60,  opacity: 0.06, scale: 0.55, rotate:  65,  size: 34,  shape: "star",      dur: 19 },
  { x: 18,  y: 15,  opacity: 0.07, scale: 1.10, rotate: -10,  size: 60,  shape: "butterfly", dur: 24 },
  { x: 82,  y: 90,  opacity: 0.06, scale: 0.90, rotate:  30,  size: 56,  shape: "butterfly", dur: 18 },
];

const Background = () => (
  <>
    {/* ── 1. Canvas aurora animé ─────────────────────────────────────────── */}
    <canvas
      id="aurora-canvas"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -30,
        pointerEvents: "none",
      }}
    />

    {/* ── 2. Grain texture ──────────────────────────────────────────────── */}
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -20,
        pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.12'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
        mixBlendMode: "multiply",
      }}
    />

    {/* ── 3. Doodles flottants ──────────────────────────────────────────── */}
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -10, pointerEvents: "none", overflow: "hidden" }}>
      {doodles.map((d, i) => {
        const Shape = ShapeMap[d.shape];
        const w = d.shape === "bone" ? d.size * 1.35 : d.shape === "fish" ? d.size * 1.25 : d.size;
        const h = d.shape === "butterfly" ? d.size * 0.75 : d.size;
        return (
          <div
            key={i}
            className="absolute text-[hsl(148_58%_22%)]"
            style={{
              left: `${d.x}%`,
              top:  `${d.y}%`,
              opacity: d.opacity * 0.7,
              width: w,
              height: h,
              transform: `rotate(${d.rotate}deg) scale(${d.scale})`,
              animation: `doodle-float-${i % 4} ${d.dur}s ease-in-out ${(i * 1.7) % 8}s infinite alternate`,
            }}
          >
            <Shape />
          </div>
        );
      })}
    </div>

    {/* ── 4. Aurora script + keyframes ─────────────────────────────────── */}
    <style>{`
      @keyframes doodle-float-0 {
        0%   { transform: translateY(0px)   translateX(0px)   rotate(0deg); }
        100% { transform: translateY(-16px) translateX(4px)   rotate(3deg); }
      }
      @keyframes doodle-float-1 {
        0%   { transform: translateY(0px)   translateX(0px)   rotate(0deg); }
        100% { transform: translateY(-10px) translateX(-6px)  rotate(-4deg); }
      }
      @keyframes doodle-float-2 {
        0%   { transform: translateY(0px)   translateX(0px)   rotate(0deg); }
        100% { transform: translateY(-20px) translateX(2px)   rotate(2deg); }
      }
      @keyframes doodle-float-3 {
        0%   { transform: translateY(0px)   translateX(0px)   rotate(0deg); }
        100% { transform: translateY(-8px)  translateX(-4px)  rotate(-2deg); }
      }
    `}</style>

    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  var canvas = document.getElementById('aurora-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var t = 0;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  var waves = [
    { color: [148, 58, 40, 0.20], freq: 0.007, amp: 0.09, phase: 0,   yBase: 0.50 },
    { color: [165, 52, 56, 0.16], freq: 0.011, amp: 0.07, phase: 1.4, yBase: 0.62 },
    { color: [30,  78, 62, 0.13], freq: 0.006, amp: 0.11, phase: 0.7, yBase: 0.42 },
    { color: [148, 45, 50, 0.18], freq: 0.009, amp: 0.08, phase: 2.1, yBase: 0.70 },
    { color: [190, 50, 65, 0.12], freq: 0.013, amp: 0.06, phase: 3.0, yBase: 0.32 },
  ];

  function draw() {
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Fond de base dégradé vert clair
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   'hsl(40, 45%, 96%)');
    bg.addColorStop(0.5, 'hsl(163, 25%, 92%)');
    bg.addColorStop(1,   'hsl(40, 35%, 97%)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Vagues ondulantes
    waves.forEach(function(w) {
      var c = w.color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (var x = 0; x <= W; x += 3) {
        var progress = x / W;
        var y = H * w.yBase
          + Math.sin(progress * Math.PI * 2.5 * (w.freq * 300) + t + w.phase) * (H * w.amp)
          + Math.sin(progress * Math.PI * 4.1 * (w.freq * 300) + t * 0.7 + w.phase * 1.3) * (H * w.amp * 0.38)
          + Math.sin(progress * Math.PI * 1.3 * (w.freq * 300) + t * 1.2 + w.phase * 0.6) * (H * w.amp * 0.22);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = 'hsla(' + c[0] + ',' + c[1] + '%,' + c[2] + '%,' + c[3] + ')';
      ctx.fill();
    });

    // Halo lumineux en haut à gauche (caractéristique aurore)
    var glow1 = ctx.createRadialGradient(W * 0.1, H * 0.05, 0, W * 0.1, H * 0.05, W * 0.45);
    glow1.addColorStop(0, 'hsla(148, 60%, 72%, 0.30)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    // Halo secondaire orangé (accent chaleureux)
    var glow2 = ctx.createRadialGradient(W * 0.88, H * 0.1, 0, W * 0.88, H * 0.1, W * 0.35);
    glow2.addColorStop(0, 'hsla(30, 80%, 78%, ' + (0.18 + Math.sin(t * 0.3) * 0.06) + ')');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    t += 0.012;
    requestAnimationFrame(draw);
  }

  draw();
})();
        `,
      }}
    />
  </>
);

export default Background;
