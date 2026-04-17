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

export const STATE_ORDER: WaterState[] = ['solid', 'liquid', 'gas'];

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
