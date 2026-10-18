import { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter'); // enter → reveal → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 400);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onFinish(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div className={`splash splash-${phase}`} aria-hidden="true">
      {/* Animated background */}
      <div className="splash-aurora" />
      <div className="splash-grid-overlay" />

      {/* Particles */}
      <div className="splash-particles">
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className="splash-particle" style={{
            '--x': `${Math.random() * 100}%`,
            '--y': `${Math.random() * 100}%`,
            '--size': `${2 + Math.random() * 4}px`,
            '--duration': `${2 + Math.random() * 3}s`,
            '--delay': `${Math.random() * 1.5}s`,
          }} />
        ))}
      </div>

      {/* Center content */}
      <div className="splash-content">
        {/* ParthCraft12 Logo */}
        <div className="splash-logo">
          <img src="/icon-192.png" alt="ParthCraft12 Logo" className="splash-logo-svg" style={{ objectFit: 'cover', borderRadius: '16px' }} />
          <div className="splash-logo-ring" />
          <div className="splash-logo-ring splash-logo-ring-2" />
        </div>

        {/* Text */}
        <h1 className="splash-title">
          <span className="splash-title-nit">ParthCraft12</span>
        </h1>
        <div className="splash-tagline">Handmade Art & Craft Community</div>
      </div>
    </div>
  );
}
