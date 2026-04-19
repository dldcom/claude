// ==================== SCREEN A1: TITLE LOGO (Retro CRT Style) ====================

function TitleScreenA({ onStart }) {
  const [showPress, setShowPress] = React.useState(true);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #151d27 0%, #1b1b26 50%, #2a1612 100%)',
      overflow: 'hidden',
    }}>
      {/* Background: ice castle left, fire castle right */}
      <div style={{ position: 'absolute', left: 80, bottom: 180, opacity: 0.85 }}>
        <IceCastle scale={8} />
      </div>
      <div style={{ position: 'absolute', right: 80, bottom: 180, opacity: 0.85 }}>
        <FireCastle scale={8} />
      </div>

      {/* Ground pixel line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 80, height: 2,
        background: 'rgba(194,204,214,0.25)',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
        background: 'linear-gradient(180deg, #1b1b26, #000)',
      }} />

      {/* Snow + embers */}
      <SnowField count={40} />
      <EmberField count={40} />

      {/* Subtitle top */}
      <div className="pixel-text shadow-med" style={{
        position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)',
        color: '#d4b77c', fontSize: 28, letterSpacing: 8,
      }}>
        ★  2인용 아케이드 어드벤처  ★
      </div>

      {/* MAIN LOGO */}
      <div style={{
        position: 'absolute', top: 200, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', width: '100%',
      }}>
        <div className="pixel-text" style={{
          fontSize: 180, lineHeight: 0.95, letterSpacing: 12,
          fontWeight: 700,
        }}>
          <span style={{
            background: 'linear-gradient(180deg, #e6ebf0 0%, #9aabb8 45%, #344454 46%, #232f3c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: 'drop-shadow(6px 6px 0 #000) drop-shadow(0 0 30px #4c6272)',
          }}>얼음공주</span>
          <span style={{
            display: 'inline-block',
            margin: '0 24px',
            color: '#d4b77c',
            fontSize: 120,
            verticalAlign: 'middle',
            filter: 'drop-shadow(4px 4px 0 #000)',
            animation: 'heartbeat 1.2s ease-in-out infinite',
          }}>&</span>
          <span style={{
            background: 'linear-gradient(180deg, #f2e6de 0%, #d49e86 45%, #6e3a2f 46%, #2a1612 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(6px 6px 0 #000) drop-shadow(0 0 30px #945646)',
          }}>불왕자</span>
        </div>
        <div className="pixel-text" style={{
          marginTop: 32, fontSize: 48, color: '#fff',
          letterSpacing: 20,
          textShadow: '4px 4px 0 #000',
        }}>
          얼음과 불의 모험
        </div>
        <div className="pixel-text" style={{
          marginTop: 16, fontSize: 22, color: '#c2ccd6',
          letterSpacing: 6,
          textShadow: '2px 2px 0 #000',
        }}>
          ─ THE ICE & FIRE QUEST ─
        </div>
      </div>

      {/* Characters flanking the logo */}
      <div style={{ position: 'absolute', left: 260, top: 580 }}>
        <IcePrincess scale={10} />
        {/* Ice glow under feet */}
        <div style={{
          position: 'absolute', left: -20, bottom: -30, width: 200, height: 20,
          background: 'radial-gradient(ellipse, #9aabb8 0%, transparent 70%)',
          animation: 'iceGlow 2s ease-in-out infinite',
        }} />
      </div>
      <div style={{ position: 'absolute', right: 260, top: 580 }}>
        <FirePrince scale={10} />
        <div style={{
          position: 'absolute', left: -20, bottom: -30, width: 200, height: 20,
          background: 'radial-gradient(ellipse, #b87860 0%, transparent 70%)',
          animation: 'iceGlow 1.5s ease-in-out infinite',
        }} />
      </div>

      {/* PRESS START */}
      <div
        onClick={onStart}
        className="pixel-text"
        style={{
          position: 'absolute', bottom: 180, left: '50%', transform: 'translateX(-50%)',
          fontSize: 44, color: '#d4b77c', letterSpacing: 10, cursor: 'pointer',
          animation: 'pressStart 1s steps(1) infinite',
          textShadow: '4px 4px 0 #000, 0 0 20px #d4b77c',
        }}
      >
        ▶  PRESS  SPACE  ◀
      </div>

      {/* Copyright-like footer */}
      <div className="pixel-text" style={{
        position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center',
        fontSize: 16, color: '#888', letterSpacing: 4,
      }}>
        © 2026  PIXEL QUEST STUDIO    ─    VERSION 1.0.0    ─    CREDITS: ∞
      </div>

      {/* CRT overlay */}
      <div className="crt-overlay strong" />
      <div className="vignette" />
    </div>
  );
}

window.TitleScreenA = TitleScreenA;
