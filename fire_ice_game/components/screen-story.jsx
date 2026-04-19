// ==================== STORY CUTSCENE ====================

function StoryScreen({ variant = 'A' }) {
  const [panel, setPanel] = React.useState(0);
  const isA = variant === 'A';

  const panels = [
    {
      title: '옛날 옛적에…',
      text: '아주 먼 북쪽, 눈과 얼음으로 덮인 <b>수정 왕국</b>.\n그리고 남쪽 끝, 화산이 숨쉬는 <b>화염 왕국</b>.\n두 왕국은 오랜 시간 서로를 모른 채 살아왔다.',
      bg: 'dual',
    },
    {
      title: '어느 날, 하늘이…',
      text: '별이 떨어지던 밤,\n두 왕국 사이에 <b>그림자의 탑</b>이 솟아올랐다.\n어둠이 얼음을 녹이고 불을 삼키기 시작했다.',
      bg: 'dark',
    },
    {
      title: '그리고 두 왕족이…',
      text: '얼음 왕국의 공주 <b>엘사벨</b>과\n불 왕국의 왕자 <b>플레이든</b>.\n서로 다른 두 힘이 만나야만 탑을 무너뜨릴 수 있다.',
      bg: 'meet',
    },
    {
      title: '이제, 모험이 시작된다.',
      text: '얼음과 불의 마음을 모아\n세상을 구해라!\n\n─ 준비됐나요? ─',
      bg: 'adventure',
    },
  ];

  const cur = panels[panel];

  const Scene = () => {
    if (cur.bg === 'dual') {
      return (
        <>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: 'linear-gradient(180deg, #151d27, #344454)' }}>
            <SnowField count={30} area={{ w: 960, h: 720 }} />
            <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
              <IceCastle scale={8} />
            </div>
          </div>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', background: 'linear-gradient(180deg, #2a1612, #6e3a2f)' }}>
            <EmberField count={30} area={{ w: 960, h: 720 }} />
            <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
              <FireCastle scale={8} />
            </div>
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 4, background: '#000', transform: 'translateX(-50%)' }} />
        </>
      );
    }
    if (cur.bg === 'dark') {
      return (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, #272732 0%, #000 70%)' }}>
          {/* Shadow tower */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 600,
            background: 'linear-gradient(180deg, #1b1b26 0%, #000 100%)',
            border: '6px solid #2a1612',
            boxShadow: '0 0 60px #6e3a2f inset, 0 0 80px #000',
          }}>
            {/* Glowing eye */}
            <div style={{
              position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
              width: 40, height: 20, background: '#b87860',
              boxShadow: '0 0 30px #b87860, 0 0 60px #6e3a2f',
              animation: 'flicker 1.5s infinite',
            }} />
          </div>
          {/* Lightning */}
          <div style={{ position: 'absolute', top: 0, left: '30%', width: 8, height: 400, background: '#fff', clipPath: 'polygon(0 0, 100% 20%, 20% 50%, 100% 80%, 0 100%)', opacity: 0.7, animation: 'flicker 0.3s infinite' }} />
          <SparkleField count={40} />
        </div>
      );
    }
    if (cur.bg === 'meet') {
      return (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #344454 0%, #6e3a2f 100%)' }}>
          <SnowField count={30} area={{ w: 960, h: 720 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}>
            <EmberField count={30} area={{ w: 960, h: 720 }} />
          </div>
          <div style={{ position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 40, alignItems: 'flex-end' }}>
            <IcePrincess scale={16} />
            <FirePrince scale={16} />
          </div>
          {/* Handshake beam */}
          <div style={{ position: 'absolute', bottom: 280, left: '50%', transform: 'translateX(-50%)', width: 200, height: 20, background: 'radial-gradient(ellipse, #d4b77c 0%, transparent 70%)' }} />
        </div>
      );
    }
    // adventure
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #151d27 0%, #d4b77c 100%)' }}>
        <SparkleField count={40} />
        <div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 40 }}>
          <IcePrincess scale={14} />
          <FirePrince scale={14} />
        </div>
        {/* Horizon path */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(180deg, transparent, rgba(42,22,18,0.7))' }} />
        <SnowField count={20} />
        <EmberField count={20} />
      </div>
    );
  };

  const html = { __html: cur.text.replace(/<b>/g, '<b style="color:#d4b77c;text-shadow:3px 3px 0 #000">').replace(/\n/g, '<br/>') };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      {/* Letterboxed scene */}
      <div style={{ position: 'absolute', top: 60, left: 60, right: 60, height: 720, overflow: 'hidden', border: '6px solid #000', background: '#000' }}>
        <Scene />
        {/* Inner vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)' }} />
      </div>

      {/* Dialogue box */}
      <div style={{
        position: 'absolute', bottom: 50, left: 60, right: 60, height: 220,
        background: 'linear-gradient(180deg, #151d27 0%, #1b1b26 100%)',
        border: '6px solid #fff',
        boxShadow: '0 0 0 4px #000, inset 0 0 0 4px #000',
        padding: '24px 40px',
        position: 'absolute',
      }}>
        {/* Speaker */}
        <div className="pixel-text" style={{
          position: 'absolute', top: -22, left: 32,
          background: '#d4b77c', color: '#000', padding: '4px 20px',
          fontSize: 22, letterSpacing: 4, border: '4px solid #000',
        }}>
          ★ NARRATOR ★
        </div>

        <div className="pixel-text" style={{ fontSize: 32, color: '#d4b77c', letterSpacing: 4, marginBottom: 16, textShadow: '3px 3px 0 #000' }}>
          {cur.title}
        </div>
        <div className="pixel-text" style={{ fontSize: 28, color: '#fff', letterSpacing: 2, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={html} />

        {/* Next arrow */}
        <div style={{ position: 'absolute', bottom: 16, right: 32 }}>
          <div className="pixel-text" style={{ fontSize: 28, color: '#d4b77c', animation: 'blink 0.8s steps(1) infinite' }}>▼</div>
        </div>
      </div>

      {/* Panel dots */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12 }}>
        {panels.map((_, i) => (
          <div key={i}
            onClick={() => setPanel(i)}
            style={{
              width: 16, height: 16,
              background: i === panel ? '#d4b77c' : '#333',
              border: '3px solid #000',
              cursor: 'pointer',
            }} />
        ))}
      </div>

      {/* Nav */}
      <div style={{ position: 'absolute', top: 20, left: 80 }}>
        <button onClick={() => setPanel(Math.max(0, panel - 1))} className="pixel-text" style={{
          padding: '8px 20px', fontSize: 18, fontFamily: 'inherit', letterSpacing: 3,
          background: '#151d27', color: '#fff', border: '3px solid #fff', cursor: 'pointer',
        }}>◀ PREV</button>
      </div>
      <div style={{ position: 'absolute', top: 20, right: 80 }}>
        <button onClick={() => setPanel(Math.min(panels.length - 1, panel + 1))} className="pixel-text" style={{
          padding: '8px 20px', fontSize: 18, fontFamily: 'inherit', letterSpacing: 3,
          background: '#2a1612', color: '#fff', border: '3px solid #fff', cursor: 'pointer',
        }}>NEXT ▶</button>
      </div>

      <div className={isA ? 'crt-overlay strong' : 'crt-overlay'} />
    </div>
  );
}

window.StoryScreen = StoryScreen;
