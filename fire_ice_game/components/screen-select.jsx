// ==================== CHARACTER SELECT ====================

function CharSelectScreen({ variant = 'A' }) {
  const [p1, setP1] = React.useState('ice');
  const [p2, setP2] = React.useState('fire');
  const isA = variant === 'A';

  const iceStats = { name: '엘사벨', en: 'ELSABEL', hp: 3, atk: 4, spd: 5, skill: '얼음 폭풍', desc: '얼음 왕국의 후계자.\n냉기로 적을 얼린다.' };
  const fireStats = { name: '플레이든', en: 'FLAYDEN', hp: 5, atk: 5, spd: 3, skill: '용염참', desc: '불 왕국의 전사.\n화염으로 길을 연다.' };

  const StatBar = ({ label, val, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="pixel-text" style={{ width: 60, fontSize: 20, color: '#ddd', letterSpacing: 2 }}>{label}</div>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{
            width: 20, height: 20,
            background: i < val ? color : '#222',
            border: '2px solid #000',
          }} />
        ))}
      </div>
    </div>
  );

  const CharCard = ({ side, data, color, selected, onSelect, player }) => (
    <div
      onClick={onSelect}
      style={{
        width: 680, height: 820,
        background: selected
          ? (side === 'ice' ? 'linear-gradient(180deg, rgba(52,68,84,0.45) 0%, rgba(21,29,39,0.9) 100%)' : 'linear-gradient(180deg, rgba(110,58,47,0.45) 0%, rgba(42,22,18,0.9) 100%)')
          : 'rgba(18,18,26,0.6)',
        border: `6px solid ${selected ? color : '#333'}`,
        boxShadow: selected ? `0 0 0 4px #000, 0 0 40px ${color}` : '0 0 0 4px #000',
        padding: 32,
        position: 'relative',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
    >
      {/* Player tag */}
      <div className="pixel-text" style={{
        position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
        background: color, color: '#000', padding: '4px 20px',
        fontSize: 20, letterSpacing: 4, border: '4px solid #000',
      }}>
        PLAYER {player}
      </div>

      {/* Name */}
      <div className="pixel-text" style={{ fontSize: 48, color: '#fff', letterSpacing: 2, textShadow: '4px 4px 0 #000', whiteSpace: 'nowrap' }}>
        {data.name}
      </div>
      <div className="pixel-text" style={{ fontSize: 18, color: color, letterSpacing: 6, marginTop: 4 }}>
        {data.en}
      </div>

      {/* Portrait frame */}
      <div style={{
        marginTop: 24, width: 320, height: 320,
        background: side === 'ice' ? 'linear-gradient(180deg, #9aabb8 0%, #344454 100%)' : 'linear-gradient(180deg, #c59898 0%, #6e3a2f 100%)',
        border: '6px solid #000',
        display: 'grid', placeItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {side === 'ice' ? <SnowField count={20} area={{ w: 320, h: 320 }} /> : <EmberField count={20} area={{ w: 320, h: 320 }} />}
        <div style={{ transform: 'scale(1.2)' }}>
          {side === 'ice' ? <IcePrincess scale={14} /> : <FirePrince scale={14} />}
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StatBar label="HP" val={data.hp} color={color} />
        <StatBar label="ATK" val={data.atk} color={color} />
        <StatBar label="SPD" val={data.spd} color={color} />
      </div>

      {/* Skill */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <div className="pixel-text" style={{ fontSize: 16, color: '#888', letterSpacing: 3 }}>SPECIAL SKILL</div>
        <div className="pixel-text" style={{ fontSize: 32, color: color, letterSpacing: 4, marginTop: 6, textShadow: '3px 3px 0 #000' }}>
          ★ {data.skill} ★
        </div>
      </div>

      {/* Description */}
      <div className="pixel-text" style={{
        marginTop: 16, fontSize: 18, color: '#ddd', letterSpacing: 1,
        textAlign: 'center', lineHeight: 1.7, whiteSpace: 'pre-line',
        wordBreak: 'keep-all',
        maxWidth: 500,
      }}>
        {data.desc}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: isA
        ? '#12121a'
        : 'linear-gradient(90deg, #151d27, #1b1b26 50%, #2a1612)',
    }}>
      {/* Top banner */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center' }}>
        <div className="pixel-text" style={{ fontSize: 24, color: '#d4b77c', letterSpacing: 12 }}>
          ─ SELECT YOUR HERO ─
        </div>
        <div className="pixel-text" style={{ fontSize: 64, color: '#fff', letterSpacing: 8, marginTop: 8, textShadow: '5px 5px 0 #000' }}>
          캐릭터 선택
        </div>
      </div>

      {/* VS badge in middle */}
      <div style={{
        position: 'absolute', top: 520, left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}>
        <div style={{
          width: 160, height: 160, borderRadius: 0,
          background: 'radial-gradient(circle, #c2a682 0%, #6e3a2f 70%, #1b1b26 100%)',
          border: '3px solid #12121a',
          display: 'grid', placeItems: 'center',
          boxShadow: '0 0 0 2px #d4b77c, 0 0 30px rgba(212,183,124,0.25)',
          animation: 'heartbeat 1.5s ease-in-out infinite',
          transform: 'rotate(-5deg)',
        }}>
          <div className="pixel-text" style={{ fontSize: 72, color: '#fff', textShadow: '4px 4px 0 #000', letterSpacing: 2 }}>
            &
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        position: 'absolute', top: 160, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 80,
      }}>
        <CharCard side="ice" data={iceStats} color="#9aabb8" selected={p1 === 'ice'} onSelect={() => setP1('ice')} player="1" />
        <CharCard side="fire" data={fireStats} color="#b87860" selected={p2 === 'fire'} onSelect={() => setP2('fire')} player="2" />
      </div>

      {/* Ready button */}
      <div style={{
        position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 32,
      }}>
        <div className="pixel-text" style={{
          padding: '16px 48px', fontSize: 32, letterSpacing: 6,
          background: 'rgba(212,183,124,0.9)', color: '#1b1b26', border: '2px solid #12121a',
          boxShadow: '0 0 0 1px rgba(232,223,201,0.4), 6px 6px 0 rgba(0,0,0,0.5)',
          cursor: 'pointer',
          animation: 'pressStart 1s steps(1) infinite',
        }}>
          ▶ READY!
        </div>
      </div>

      <div className={isA ? 'crt-overlay strong' : 'crt-overlay'} />
      <div className="vignette" />
    </div>
  );
}

window.CharSelectScreen = CharSelectScreen;
