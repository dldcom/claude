export type WaterState = 'solid' | 'liquid' | 'gas';

export interface Order {
  id: string;
  name: string;
  emoji: string;
  target: WaterState;
}

export const ORDERS: readonly Order[] = [
  { id: 'ice_cream',       name: '아이스크림',     emoji: '🍦', target: 'solid'  },
  { id: 'ice_cube',        name: '얼음 큐브',       emoji: '🧊', target: 'solid'  },
  { id: 'aquarium_water',  name: '수족관 물',       emoji: '🐟', target: 'liquid' },
  { id: 'cold_drink',      name: '시원한 음료수',   emoji: '🥤', target: 'liquid' },
  { id: 'humidifier_vapor',name: '가습기 수증기',   emoji: '💨', target: 'gas'    },
  { id: 'sauna_steam',     name: '찜질방 스팀',     emoji: '♨️', target: 'gas'    }
] as const;

export const RULES = {
  INITIAL_LIVES: 5,
  INITIAL_TIME_MS: 10_000,
  MIN_TIME_MS: 4_000,
  TIME_STEP_MS: 500,
  TIME_STEP_EVERY_SCORE: 200,
  BASE_CORRECT_POINTS: 100,
  TIME_BONUS_PER_SECOND: 10,
  TRANSITION_MS: 500
} as const;

export const STATE_ORDER: readonly WaterState[] = ['solid', 'liquid', 'gas'];

/**
 * 교과서 용어로 표현한 4가지 상태 변화 이름.
 * `getTransitionPopup`이 반환하는 팝업의 title 앞부분과 대응한다.
 * 새 전이를 추가하려면 이 유니온과 `getTransitionPopup`의 분기를 함께 업데이트할 것.
 */
export type TransitionName = '녹음' | '끓음' | '응결' | '얼음';

export interface TransitionPopup {
  title: string;
  subtitle: string;
}

export function getTransitionPopup(from: WaterState, to: WaterState): TransitionPopup | null {
  if (from === 'solid'  && to === 'liquid') return { title: '녹음 성공!',   subtitle: '얼음 → 물' };
  if (from === 'liquid' && to === 'gas')    return { title: '끓음 성공!',   subtitle: '물 → 수증기' };
  if (from === 'gas'    && to === 'liquid') return { title: '응결 성공!',   subtitle: '수증기 → 물' };
  if (from === 'liquid' && to === 'solid')  return { title: '얼음 완성!',   subtitle: '물이 얼었어요' };
  return null;
}

export interface Customer {
  id: string;
  emoji: string;
  name: string;
  greetings: readonly string[];
}

export const CUSTOMERS: readonly Customer[] = [
  {
    id: 'grandma', emoji: '👵', name: '옆집 할머니',
    greetings: ['아이고 시원한 거 없니~', '할머니 목 탄다야', '빠르게 부탁해~']
  },
  {
    id: 'chef', emoji: '🧑‍🍳', name: '바쁜 요리사',
    greetings: ['주방 바빠요! 빨리!', '주문 밀려있어요', '급해요 급해~']
  },
  {
    id: 'kid', emoji: '👧', name: '신난 어린이',
    greetings: ['우와 빨리빨리요!', '너무 더워요~', '맛있겠다!']
  },
  {
    id: 'office', emoji: '🧑‍💼', name: '점심시간 직장인',
    greetings: ['점심 시간이에요', '한 잔 부탁합니다', '짧게 부탁해요']
  },
  {
    id: 'scientist', emoji: '🧑‍🔬', name: '호기심 과학자',
    greetings: ['실험에 필요해요!', '오 상태 변화!', '재미있어요']
  }
] as const;

export interface Rank {
  id: string;
  name: string;
  icon: string;
  minScore: number;
}

export const RANKS: readonly Rank[] = [
  { id: 'newbie',  name: '신입 공장장',   icon: '🥉', minScore: 0    },
  { id: 'skilled', name: '숙련 공장장',   icon: '🥈', minScore: 301  },
  { id: 'master',  name: '달인 공장장',   icon: '🥇', minScore: 1001 },
  { id: 'legend',  name: '전설의 공장장', icon: '💎', minScore: 2501 },
  { id: 'myth',    name: '신화의 공장장', icon: '👑', minScore: 5001 }
] as const;

export function getRank(score: number): Rank {
  let result = RANKS[0];
  for (const r of RANKS) {
    if (score >= r.minScore) result = r;
  }
  return result;
}

export function getNextRank(score: number): Rank | null {
  for (const r of RANKS) {
    if (score < r.minScore) return r;
  }
  return null;
}

export function getRankIndex(rank: Rank): number {
  return RANKS.findIndex(r => r.id === rank.id);
}
