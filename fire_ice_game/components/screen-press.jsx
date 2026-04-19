// ==================== PRESS START (Boot / Attract) ====================

function PressStartScreen({ variant = 'A' }) {
  const [flash, setFlash] = React.useState(false);
  const isA = variant === 'A';

  React.useEffect(() => {
    const id = setInterval(() => setFlash(f => !f), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: isA ? '#000' : 'linear-gradient(180deg, #151d27 0%, #000 100%)',
      overflow: 'hidden',
    }}>
      {/* Attract-mode pulsing rings */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 1200, height: 1200, borderRadius: '50%',
        border: '3px solid rgba(143, 208, 255, 0.3)',
        animation: 'heartbeat 2s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 900, height: 900, borderRadius: '50%',
        border: '3px solid rgba(255, 111, 42, 0.3)',
        animation: 'heartbeat 2s ease-in-out infinite',
        animationDelay: '-0.5s',
      }} />

      {/* Background characters small and distant */}
      <div style={{ position: 'absolute', left: 200, top: 180, opacity: 0.3 }}>
        <IcePrincess scale={8} />
      </div>
      <div style={{ position: 'absolute', right: 200, top: 180, opacity: 0.3 }}>
        <FirePrince scale={8} />
      </div>

      <SparkleField count={30} />

      {/* Top banner */}
      <div className="pixel-text" style={{
        position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
        fontSize: 22, color: '#888', letterSpacing: 8,
      }}>
        INSERT  COIN  TO  CONTINUE
      </div>

      {/* Logo */}
      <div style={{ position: 'absolute', top: 260, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div className="pixel-text" style={{
          fontSize: 120, lineHeight: 1, letterSpacing: 8,
        }}>
          <span style={{ color: '#9aabb8', textShadow: '6px 6px 0 #000, 0 0 30px #4c6272' }}>얼음공주</span>
          <br />
          <span style={{ color: '#d4b77c', fontSize: 60, margin: '16px 0', display: 'inline-block', textShadow: '4px 4px 0 #000' }}>×</span>
          <br />
          <span style={{ color: '#b87860', textShadow: '6px 6px 0 #000, 0 0 30px #945646' }}>불왕자</span>
        </div>
      </div>

      {/* Giant Press Start */}
      <div style={{
        position: 'absolute', top: 680, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center',
      }}>
        <div className="pixel-text" style={{
          fontSize: 72, letterSpacing: 16,
          color: flash ? '#d4b77c' : 'transparent',
          WebkitTextStroke: flash ? '0' : '4px #d4b77c',
          textShadow: flash ? '6px 6px 0 #000, 0 0 40px #d4b77c' : '6px 6px 0 #000',
        }}>
          PRESS  START
        </div>
        <div className="pixel-text" style={{
          marginTop: 24, fontSize: 28, color: '#fff', letterSpacing: 8, textShadow: '3px 3px 0 #000',
        }}>
          ─  아무 키나 눌러주세요  ─
        </div>
      </div>

      {/* High score strip */}
      <div style={{
        position: 'absolute', bottom: 120, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 80,
        fontSize: 22, letterSpacing: 4,
      }} className="pixel-text">
        <div><span style={{ color: '#9aabb8' }}>HI-SCORE</span> <span style={{ color: '#fff' }}>001337</span></div>
        <div><span style={{ color: '#d4b77c' }}>1UP</span> <span style={{ color: '#fff' }}>000000</span></div>
        <div><span style={{ color: '#b87860' }}>2UP</span> <span style={{ color: '#fff' }}>000000</span></div>
      </div>

      {/* Credits */}
      <div className="pixel-text" style={{
        position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
        fontSize: 18, color: '#666', letterSpacing: 3,
      }}>
        CREDIT 00    ─    ⓒ 2026 PIXEL QUEST STUDIO
      </div>

      <div className={isA ? 'crt-overlay strong' : 'crt-overlay'} />
      <div className="vignette" />
    </div>
  );
}

window.PressStartScreen = PressStartScreen;
