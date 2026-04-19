// ==================== PIXEL SPRITES ====================
// All characters rendered as SVG with pixel-perfect rects.
// Each "pixel" is a rect. Style: cute chibi, 16x20 grid typically.

// ---- Helper: convert 2D array to SVG rects ----
function PixelGrid({ map, palette, scale = 8, className = '', style = {}, animated = null }) {
  const rows = map.length;
  const cols = map[0].length;
  const rects = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = map[y][x];
      if (key === '.' || key === ' ') continue;
      const color = palette[key];
      if (!color) continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />
      );
    }
  }
  return (
    <svg
      width={cols * scale}
      height={rows * scale}
      viewBox={`0 0 ${cols} ${rows}`}
      className={className}
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', ...style }}
    >
      {rects}
    </svg>
  );
}

// ===================== ICE PRINCESS =====================
// 16 wide x 22 tall
const ICE_PRINCESS_MAP = [
  '................',
  '.....22222......',
  '....2111112.....',   // tiara
  '...2133331332...',
  '..21c1111111c12.',   // ice blue hair frame
  '..2cc44444cc12..',   // face top
  '..21444444412...',
  '..2145444541.2..',   // eyes
  '..2144944412...',    // nose
  '..214444421....',
  '..214333421....',   // mouth area
  '...2bbbbbb2.....',
  '..2b6666666b2...',   // dress collar (cyan)
  '.2b66677666b2...',
  '2b6777b7776b2...',   // dress body
  '2b6777777776b2..',
  '2b6667776666b2..',
  '.2b66666666b2...',
  '..2bbbbbbbb2....',
  '...288..882.....',
  '...288..882.....',
  '...2222..2222...',
];
const ICE_PALETTE = {
  '1': '#dcc8b0', // skin
  '2': '#000',    // outline
  '3': '#c9a960', // tiara gem
  '4': '#ead5bd', // face light
  '5': '#344454', // eyes ice blue
  '6': '#c2ccd6', // dress light
  '7': '#9aabb8', // dress mid
  '8': '#6d8294', // shoes
  '9': '#c59898', // cheeks
  'a': '#fff',
  'b': '#4c6272', // dress outline
  'c': '#a8b6c2', // hair ice blue
};

// ===================== FIRE PRINCE =====================
const FIRE_PRINCE_MAP = [
  '................',
  '....ff..ff......',   // flame hair tips
  '...fff..fff.....',
  '...33333333.....',   // red hair
  '..2333333332....',
  '..234444442.....',
  '..23555554.2....',   // face
  '..2355e5554.....',   // eyes fire
  '..2344944432....',
  '..2344443332....',   // nose/jaw
  '..23333333.2....',
  '..23ppppp32.....',   // mouth/chin dark
  '..2cccccccc2....',   // cape collar gold
  '.2c7788877c2....',   // chest armor
  '2c78887888c2....',
  '2c777p7777c2....',   // belt
  '2c888e88888c2...',
  '.2c88888888c2...',
  '..2ccc..cccc2...',   // legs
  '...2kk..kk2.....',
  '...2kk..kk2.....',
  '...2222..2222...',
];
const FIRE_PALETTE = {
  '2': '#000',
  '3': '#6e3a2f', // hair dark red
  '4': '#d9bfa3', // skin
  '5': '#e6cdb4', // face light
  'e': '#4a2721', // eyes dark
  '9': '#b87860', // nose highlight
  'p': '#4a2721', // shadow
  'c': '#d4b77c', // gold trim
  '7': '#b87860', // fire orange
  '8': '#945646', // fire red-orange
  'k': '#4a2721', // boots dark
  'f': '#cc8e72', // flame hair tip
};

// ===================== ENEMY: ICY WISP =====================
const WISP_MAP = [
  '........',
  '..2222..',
  '.211112.',
  '2155512.',
  '2111112.',
  '2111112.',
  '.211112.',
  '..2222..',
];
const WISP_PALETTE = {
  '1': '#c2ccd6',
  '2': '#6d8294',
  '5': '#344454',
};

// ===================== HEART =====================
const HEART_MAP = [
  '.22..22.',
  '2112112.',
  '2111112.',
  '2111112.',
  '.21112..',
  '..212...',
  '...2....',
];
const HEART_PALETTE = {
  '1': '#b87860',
  '2': '#4a2721',
};

// ===================== STAR =====================
const STAR_MAP = [
  '...22...',
  '..2112..',
  '.211112.',
  '2211122.',
  '.22.22..',
  '.2...2..',
];
const STAR_PALETTE = { '1': '#d4b77c', '2': '#6e3a2f' };

// ===================== CASTLE (simplified) =====================
const ICE_CASTLE_MAP = [
  '......2.....2.....2.....',
  '.....212...212...212....',
  '.....212...212...212....',
  '....21112.21112.21112...',
  '....21aa2.21aa2.21aa2...',
  '....21aa222aa222aa12....',
  '....2111111111111112....',
  '....2166611666116612....',
  '....2166611666116612....',
  '....2111111111111112....',
  '....21aaa1aaaa1aaa12....',
  '....21aaa1aaaa1aaa12....',
  '....2111111111111112....',
  '....2222222222222222....',
];
const ICE_CASTLE_PALETTE = {
  '1': '#c2ccd6',
  '2': '#344454',
  '6': '#4c6272',
  'a': '#9aabb8',
};

const FIRE_CASTLE_MAP = [
  '......2.....2.....2.....',
  '.....2f2...2f2...2f2....',
  '.....2f2...2f2...2f2....',
  '....21112.21112.21112...',
  '....21aa2.21aa2.21aa2...',
  '....21aa222aa222aa12....',
  '....2111111111111112....',
  '....21eee1eeee1eee112...',
  '....2133311333113331 ...',
  '....2111111111111112....',
  '....21aaa1aaaa1aaa12....',
  '....21aaa1aaaa1aaa12....',
  '....2111111111111112....',
  '....2222222222222222....',
];
const FIRE_CASTLE_PALETTE = {
  '1': '#b87860',
  '2': '#2a1612',
  'f': '#d4b77c',
  'e': '#4a2721',
  '3': '#6e3a2f',
  'a': '#945646',
};

// ===================== COMPONENTS =====================
function IcePrincess({ scale = 8, style = {}, animated = true }) {
  return (
    <div style={{ animation: animated ? 'bob 1.8s steps(4) infinite' : 'none', ...style }}>
      <PixelGrid map={ICE_PRINCESS_MAP} palette={ICE_PALETTE} scale={scale} />
    </div>
  );
}

function FirePrince({ scale = 8, style = {}, animated = true }) {
  return (
    <div style={{ animation: animated ? 'bob 1.6s steps(4) infinite' : 'none', animationDelay: '-0.2s', ...style }}>
      <PixelGrid map={FIRE_PRINCE_MAP} palette={FIRE_PALETTE} scale={scale} />
    </div>
  );
}

function IcyWisp({ scale = 6, style = {} }) {
  return (
    <div style={{ animation: 'bobSlow 2s steps(4) infinite', ...style }}>
      <PixelGrid map={WISP_MAP} palette={WISP_PALETTE} scale={scale} />
    </div>
  );
}

function Heart({ scale = 4, style = {} }) {
  return <PixelGrid map={HEART_MAP} palette={HEART_PALETTE} scale={scale} style={style} />;
}

function Star({ scale = 4, style = {} }) {
  return <PixelGrid map={STAR_MAP} palette={STAR_PALETTE} scale={scale} style={style} />;
}

function IceCastle({ scale = 10, style = {} }) {
  return <PixelGrid map={ICE_CASTLE_MAP} palette={ICE_CASTLE_PALETTE} scale={scale} style={style} />;
}

function FireCastle({ scale = 10, style = {} }) {
  return <PixelGrid map={FIRE_CASTLE_MAP} palette={FIRE_CASTLE_PALETTE} scale={scale} style={style} />;
}

// ==================== PARTICLE SYSTEMS ====================
function SnowField({ count = 60, area = { w: 1920, h: 1080 } }) {
  const flakes = React.useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * area.w,
    size: 2 + Math.floor(Math.random() * 3) * 2,
    delay: Math.random() * -8,
    dur: 6 + Math.random() * 8,
    drift: (Math.random() - 0.5) * 60,
  })), [count, area.w]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {flakes.map(f => (
        <div
          key={f.id}
          style={{
            position: 'absolute',
            left: f.x,
            top: -20,
            width: f.size,
            height: f.size,
            background: '#fff',
            boxShadow: `0 0 4px #c2ccd6`,
            animation: `snowfall ${f.dur}s linear infinite`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function EmberField({ count = 50, area = { w: 1920, h: 1080 } }) {
  const embers = React.useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * area.w,
    size: 2 + Math.floor(Math.random() * 3) * 2,
    delay: Math.random() * -10,
    dur: 5 + Math.random() * 6,
    drift: (Math.random() - 0.5) * 120 + 'px',
    color: ['#b87860', '#d4b77c', '#945646', '#d49e86'][Math.floor(Math.random() * 4)],
  })), [count, area.w]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {embers.map(e => (
        <div
          key={e.id}
          style={{
            position: 'absolute',
            left: e.x,
            bottom: -20,
            width: e.size,
            height: e.size,
            background: e.color,
            boxShadow: `0 0 6px ${e.color}`,
            animation: `emberRise ${e.dur}s linear infinite`,
            animationDelay: `${e.delay}s`,
            ['--drift']: e.drift,
          }}
        />
      ))}
    </div>
  );
}

function SparkleField({ count = 20, area = { w: 1920, h: 1080 } }) {
  const sparkles = React.useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * area.w,
    y: Math.random() * area.h,
    delay: Math.random() * 3,
    size: 4 + Math.floor(Math.random() * 3) * 2,
  })), [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {sparkles.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            background: '#fff',
            boxShadow: `0 0 8px #fff, 0 0 12px #d4b77c`,
            animation: `sparkle 2s steps(4) infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Expose
Object.assign(window, {
  PixelGrid, IcePrincess, FirePrince, IcyWisp, Heart, Star,
  IceCastle, FireCastle, SnowField, EmberField, SparkleField,
});
