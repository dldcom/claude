// ==================== SCREEN B1: TITLE LOGO (Cinematic Pixel Art) ====================

function TitleScreenB({ onStart }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(90deg, #151d27 0%, #344454 30%, #4a2721 70%, #2a1612 100%)',
      overflow: 'hidden',
    }}>
      {/* Sky stars — ice side */}
      <SparkleField count={30} area={{ w: 960, h: 600 }} />

      {/* Dividing vertical beam of light in middle */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2,
        background: 'linear-gradient(180deg, transparent, #fff, transparent)',
        boxShadow: '0 0 40px 8px rgba(255,255,255,0.5)',
        transform: 'translateX(-50%)',
      }} />

      {/* Left half: ICE KINGDOM */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%',
        clipPath: 'polygon(0 0, 100% 0, calc(100% - 60px) 100%, 0 100%)',
      }}>
        {/* Mountains */}
        <div style={{
          position: 'absolute', bottom: 200, left: 0, right: 0, height: 400,
          background: `
            linear-gradient(135deg, transparent 49.5%, #4c6272 50%, #4c6272 50.5%, transparent 51%),
            linear-gradient(-135deg, transparent 49.5%, #4c6272 50%, #4c6272 50.5%, transparent 51%)
          `,
          opacity: 0.3,
        }} />
        {/* Ice mountain shape using clip-path triangles */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} viewBox="0 0 960 1080" preserveAspectRatio="none">
          <polygon points="0,700 200,400 350,600 500,300 700,550 960,500 960,1080 0,1080" fill="#344454" />
          <polygon points="0,800 200,500 350,700 500,400 700,650 960,600 960,1080 0,1080" fill="#4c6272" opacity="0.8" />
          <polygon points="200,400 250,450 150,450" fill="#e6ebf0" />
          <polygon points="500,300 560,380 440,380" fill="#e6ebf0" />
        </svg>

        <div style={{ position: 'absolute', bottom: 280, left: 220 }}>
          <IceCastle scale={7} />
        </div>

        <SnowField count={50} area={{ w: 960, h: 1080 }} />
      </div>

      {/* Right half: FIRE KINGDOM */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%',
        clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
      }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} viewBox="0 0 960 1080" preserveAspectRatio="none">
          <polygon points="0,500 260,550 450,300 600,600 760,400 960,700 960,1080 0,1080" fill="#4a2721" />
          <polygon points="0,600 260,650 450,400 600,700 760,500 960,800 960,1080 0,1080" fill="#6e3a2f" opacity="0.8" />
          <polygon points="450,300 510,380 390,380" fill="#d4b77c" />
        </svg>

        <div style={{ position: 'absolute', bottom: 280, right: 220 }}>
          <FireCastle scale={7} />
        </div>

        <EmberField count={50} area={{ w: 960, h: 1080 }} />
      </div>

      {/* CENTER LOGO */}
      <div style={{
        position: 'absolute', top: 180, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', width: 1400,
      }}>
        <div className="pixel-text" style={{
          fontSize: 36, color: '#e8dfc9', letterSpacing: 16, marginBottom: 32,
          textShadow: '3px 3px 0 #000',
        }}>
          ·  A  PIXEL  TALE  ·
        </div>

        <div className="pixel-text" style={{
          fontSize: 180, lineHeight: 0.9, letterSpacing: 24, fontWeight: 700,
          color: '#fff',
          textShadow: `
            6px 0 0 #000, -6px 0 0 #000, 0 6px 0 #000, 0 -6px 0 #000,
            6px 6px 0 #000, -6px -6px 0 #000, 6px -6px 0 #000, -6px 6px 0 #000,
            12px 12px 0 #151d27, 24px 24px 0 #2a1612
          `,
        }}>
          얼음 × 불
        </div>

        <div className="pixel-text" style={{
          marginTop: 40, fontSize: 56, color: '#d4b77c', letterSpacing: 30,
          textShadow: '5px 5px 0 #000',
        }}>
          왕국의 모험
        </div>
      </div>

      {/* Characters — large center foreground */}
      <div style={{
        position: 'absolute', bottom: 100, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 80, alignItems: 'flex-end',
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: -20, left: 50, width: 260, height: 40,
            background: 'radial-gradient(ellipse, #9aabb8 0%, transparent 70%)',
            filter: 'blur(2px)',
          }} />
          <IcePrincess scale={14} />
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: -20, left: 50, width: 260, height: 40,
            background: 'radial-gradient(ellipse, #b87860 0%, transparent 70%)',
            filter: 'blur(2px)',
          }} />
          <FirePrince scale={14} />
        </div>
      </div>

      {/* Press start - bottom */}
      <div
        onClick={onStart}
        className="pixel-text"
        style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          fontSize: 32, color: '#fff', letterSpacing: 8, cursor: 'pointer',
          padding: '16px 48px',
          border: '4px solid #fff',
          background: 'rgba(0,0,0,0.5)',
          animation: 'pressStart 1.2s steps(1) infinite',
          textShadow: '3px 3px 0 #000',
        }}
      >
        ▶  PRESS  START  ◀
      </div>

      <div className="crt-overlay" />
      <div className="vignette" />
    </div>
  );
}

window.TitleScreenB = TitleScreenB;
