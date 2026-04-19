// ==================== MAIN MENU ====================

function MainMenuScreen({ variant = 'A', onSelect }) {
  const [hovered, setHovered] = React.useState(0);
  const items = [
    { key: 'start', label: '모험 시작', sub: 'START  GAME' },
    { key: 'select', label: '캐릭터 선택', sub: 'CHARACTER' },
    { key: 'ranking', label: '명예의 전당', sub: 'RANKING' },
    { key: 'settings', label: '설정', sub: 'SETTINGS' },
    { key: 'quit', label: '종료', sub: 'QUIT' },
  ];

  const isA = variant === 'A';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: isA
        ? 'linear-gradient(180deg, #151d27 0%, #272732 50%, #2a1612 100%)'
        : 'linear-gradient(120deg, #232f3c 0%, #1b1b26 50%, #4a2721 100%)',
      overflow: 'hidden',
    }}>
      <SnowField count={30} />
      <EmberField count={30} />

      {/* Header logo (smaller) */}
      <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div className="pixel-text" style={{ fontSize: 24, color: '#d4b77c', letterSpacing: 10, textShadow: '2px 2px 0 #000' }}>
          ─  PIXEL QUEST  ─
        </div>
        <div className="pixel-text" style={{ fontSize: 72, letterSpacing: 4, marginTop: 12, whiteSpace: 'nowrap' }}>
          <span style={{ color: '#9aabb8', textShadow: '4px 4px 0 #000' }}>얼음공주</span>
          <span style={{ color: '#d4b77c', margin: '0 16px', textShadow: '4px 4px 0 #000' }}>×</span>
          <span style={{ color: '#b87860', textShadow: '4px 4px 0 #000' }}>불왕자</span>
        </div>
      </div>

      {/* Characters on sides */}
      <div style={{ position: 'absolute', left: 180, top: 460 }}>
        <IcePrincess scale={12} />
      </div>
      <div style={{ position: 'absolute', right: 180, top: 460 }}>
        <FirePrince scale={12} />
      </div>

      {/* Floating wisps */}
      <div style={{ position: 'absolute', left: 120, top: 360 }}><IcyWisp scale={5} /></div>
      <div style={{ position: 'absolute', right: 130, top: 380 }}>
        <div style={{ animation: 'flameDance 0.5s steps(3) infinite' }}>
          <div style={{ width: 24, height: 36, background: 'linear-gradient(180deg, #d4b77c 0%, #b87860 60%, #6e3a2f 100%)', clipPath: 'polygon(50% 0, 100% 60%, 80% 100%, 20% 100%, 0 60%)' }} />
        </div>
      </div>

      {/* MENU */}
      <div style={{
        position: 'absolute', top: 380, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        minWidth: 720,
      }}>
        {items.map((item, i) => {
          const active = hovered === i;
          return (
            <div
              key={item.key}
              onMouseEnter={() => setHovered(i)}
              onClick={() => onSelect && onSelect(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 24,
                padding: '14px 40px',
                minWidth: 680,
                width: 680,
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                background: active ? 'rgba(255,223,107,0.15)' : 'transparent',
                border: active ? '4px solid #d4b77c' : '4px solid transparent',
                cursor: 'pointer',
                transition: 'none',
                position: 'relative',
              }}
            >
              {active && (
                <div className="pixel-text" style={{ position: 'absolute', left: 24, color: '#d4b77c', fontSize: 32, animation: 'blink 0.6s steps(1) infinite' }}>▶</div>
              )}
              <div className="pixel-text" style={{
                fontSize: 40,
                color: active ? '#fff' : '#c2ccd6',
                letterSpacing: 3,
                textShadow: active ? '4px 4px 0 #000, 0 0 20px #d4b77c' : '3px 3px 0 #000',
              }}>
                {item.label}
              </div>
              <div className="pixel-text" style={{
                fontSize: 18,
                color: active ? '#d4b77c' : '#666',
                letterSpacing: 4,
              }}>
                {item.sub}
              </div>
              {active && (
                <div className="pixel-text" style={{ position: 'absolute', right: 24, color: '#d4b77c', fontSize: 32, animation: 'blink 0.6s steps(1) infinite' }}>◀</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hints */}
      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 48,
        fontSize: 20, color: '#aaa', letterSpacing: 3,
      }} className="pixel-text">
        <span><span style={{ color: '#d4b77c' }}>[↑↓]</span> 선택</span>
        <span><span style={{ color: '#d4b77c' }}>[ENTER]</span> 확인</span>
        <span><span style={{ color: '#d4b77c' }}>[ESC]</span> 뒤로</span>
      </div>

      <div className={isA ? 'crt-overlay strong' : 'crt-overlay'} />
      <div className="vignette" />
    </div>
  );
}

window.MainMenuScreen = MainMenuScreen;
