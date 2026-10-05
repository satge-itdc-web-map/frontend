import React from 'react';

function GlobeNeon({ size = 200 }) {
  const R = size / 2;
  const meridians = 5;
  const parallels = 4;

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: -40,
        background: 'radial-gradient(circle, var(--globe-glow-a) 0%, transparent 60%)',
        filter: 'blur(28px)',
      }} />
      <div style={{
        position: 'absolute', inset: -15,
        background: 'radial-gradient(circle, var(--globe-glow-b) 0%, transparent 65%)',
        filter: 'blur(18px)',
      }} />

      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'var(--globe-sphere-bg)',
        boxShadow: 'var(--globe-sphere-shadow)',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        transformStyle: 'preserve-3d',
        animation: 'loadingGlobeSpin 7s linear infinite',
      }}>
        {Array.from({ length: meridians }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid var(--globe-primary-60)',
            boxShadow: '0 0 8px var(--globe-primary-40), inset 0 0 8px var(--globe-primary-10)',
            transform: `rotateY(${i * (180 / meridians)}deg)`,
            filter: 'blur(0.5px)',
          }} />
        ))}
      </div>

      <svg style={{ position: 'absolute', inset: 0 }}
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="neon-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {Array.from({ length: parallels }).map((_, i) => {
          const angle = ((i + 1) / (parallels + 1)) * Math.PI;
          const y = R - R * Math.cos(angle);
          const rx = R * Math.abs(Math.sin(angle));
          const isEq = i === Math.floor(parallels / 2);
          return (
            <ellipse key={i} cx={R} cy={y} rx={rx} ry={rx * 0.22}
              fill="none"
              style={{
                stroke: isEq ? 'var(--globe-primary)' : 'var(--globe-primary-50)',
                filter: isEq ? 'drop-shadow(0 0 4px var(--globe-primary))' : 'url(#neon-blur)',
              }}
              strokeWidth={isEq ? 2 : 1.2} />
          );
        })}
      </svg>

      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        boxShadow: '0 0 20px var(--globe-primary-25), inset 0 0 0 1.5px var(--globe-primary-60)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', top: '8%', left: '14%',
        width: '30%', height: '20%', borderRadius: '50%',
        background: 'var(--globe-shine)',
      }} />
    </div>
  );
}

function LoadingGlobe({
  message = 'Chargement des données...',
  size,
  minHeight = '300px',
  fullScreen = false,
}) {
  // Taille par défaut plus grande en plein écran, sauf si une taille est
  // explicitement précisée par l'appelant.
  const resolvedSize = size ?? (fullScreen ? 340 : 200);

  return (
    <div
      className="loading-globe-section"
      style={fullScreen ? { position: 'fixed', inset: 0, zIndex: 2000 } : { minHeight }}
    >
      <style>{`
        @keyframes loadingGlobeSpin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }

        .loading-globe-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
          border-radius: 12px;

          background: #ffffff;
          --globe-sphere-bg: radial-gradient(circle at 35% 32%, #f4faf3 0%, #e6f2e3 80%);
          --globe-sphere-shadow: inset -8px -8px 20px rgba(109,190,69,0.08);
          --globe-shine: radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%);
          --globe-primary: #6DBE45;
          --globe-primary-60: rgba(109,190,69,0.6);
          --globe-primary-50: rgba(109,190,69,0.5);
          --globe-primary-40: rgba(109,190,69,0.35);
          --globe-primary-25: rgba(109,190,69,0.2);
          --globe-primary-10: rgba(109,190,69,0.08);
          --globe-glow-a: rgba(109,190,69,0.15);
          --globe-glow-b: rgba(109,190,69,0.08);
        }
        .loading-globe-section .loading-globe-text {
          color: #4a6b52;
        }

        @media (prefers-color-scheme: dark) {
          .loading-globe-section {
            background: radial-gradient(ellipse at 50% 50%, #0a1a0f 0%, #050a06 100%);
            --globe-sphere-bg: radial-gradient(circle at 35% 32%, #0b1f0f 0%, #04080a 80%);
            --globe-sphere-shadow: inset -10px -10px 30px rgba(0,0,0,0.9);
            --globe-shine: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
            --globe-primary: #6DBE45;
            --globe-primary-60: rgba(109,190,69,0.6);
            --globe-primary-50: rgba(109,190,69,0.5);
            --globe-primary-40: rgba(109,190,69,0.4);
            --globe-primary-25: rgba(109,190,69,0.25);
            --globe-primary-10: rgba(109,190,69,0.1);
            --globe-glow-a: rgba(109,190,69,0.22);
            --globe-glow-b: rgba(30,120,80,0.1);
          }
          .loading-globe-section .loading-globe-text {
            color: #a8c4b0;
          }
        }

        .dark .loading-globe-section,
        [data-theme="dark"] .loading-globe-section {
          background: radial-gradient(ellipse at 50% 50%, #0a1a0f 0%, #050a06 100%) !important;
          --globe-sphere-bg: radial-gradient(circle at 35% 32%, #0b1f0f 0%, #04080a 80%);
          --globe-sphere-shadow: inset -10px -10px 30px rgba(0,0,0,0.9);
          --globe-shine: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
          --globe-primary: #6DBE45;
          --globe-primary-60: rgba(109,190,69,0.6);
          --globe-primary-50: rgba(109,190,69,0.5);
          --globe-primary-40: rgba(109,190,69,0.4);
          --globe-primary-25: rgba(109,190,69,0.25);
          --globe-primary-10: rgba(109,190,69,0.1);
          --globe-glow-a: rgba(109,190,69,0.22);
          --globe-glow-b: rgba(30,120,80,0.1);
        }
        .dark .loading-globe-section .loading-globe-text,
        [data-theme="dark"] .loading-globe-section .loading-globe-text {
          color: #a8c4b0 !important;
        }
      `}</style>
      <GlobeNeon size={resolvedSize} />
      {message && (
        <p className="loading-globe-text" style={{
          fontSize: fullScreen ? 16 : 14, fontWeight: 500, margin: 0,
          letterSpacing: '0.02em', textAlign: 'center',
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default LoadingGlobe; 