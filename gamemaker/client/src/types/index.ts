// === DB 엔티티 ===

export interface Teacher {
  id: number;
  login_id: string;
  created_at: string;
}

export interface GameClass {
  id: number;
  teacher_id: number;
  name: string;
  school_year: number;
}

export interface AvatarConfig {
  body: string;
  hair: string;
  torso: string;
  legs: string;
  feet: string;
}

export interface Student {
  id: number;
  class_id: number;
  name: string;
  avatar_config: AvatarConfig;
  coins: number;
  created_at: string;
}

export type StoryPhase = 'intro' | 'develop' | 'crisis' | 'climax' | 'conclusion';
export type QuizType = 'blank_fill' | 'multiple_choice' | 'matching' | 'ox';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Region {
  id: number;
  name: string;
  theme: string;
  intro_dialogue: string[];
  ending_dialogue: string[];
  epilogue_dialogue: string[];
  story_synopsis: string;
  sort_order: number;
}

export interface NPC {
  id: number;
  region_id: number;
  name: string;
  character_desc: string;
  story_phase: StoryPhase;
  dialogue_before: string[];
  dialogue_correct: string[];
  dialogue_wrong: string[];
  dialogue_after: string[];
  next_npc_hint: string;
  position_x: number;
  position_y: number;
  quiz_type: QuizType;
  quiz_difficulty: Difficulty;
  sort_order: number;
}

// === 퀴즈 콘텐츠 ===

export interface BlankFillContent {
  type: 'blank_fill';
  sentence: string;
  options: string[];
}

export interface MultipleChoiceContent {
  type: 'multiple_choice';
  question: string;
  options: string[];
  correct_index: number;
}

export interface MatchingContent {
  type: 'matching';
  pairs: { left: string; right: string }[];
}

export interface OXContent {
  type: 'ox';
  statement: string;
  answer: boolean;
}

export type QuizContent =
  | BlankFillContent
  | MultipleChoiceContent
  | MatchingContent
  | OXContent;

export interface Question {
  id: number;
  npc_id: number;
  content: QuizContent;
  correct_answer: string;
  coin_reward: number;
}

// === 진행도 ===

export interface StudentProgress {
  npc_id: number;
  is_cleared: boolean;
  cleared_at: string | null;
}

export interface QuizAttempt {
  question_id: number;
  answer: string;
  is_correct: boolean;
  attempted_at: string;
}

// === 상점 ===

export type ItemCategory = 'hair' | 'torso' | 'legs' | 'feet' | 'hat' | 'cape' | 'weapon';

export interface ShopItem {
  id: number;
  name: string;
  category: ItemCategory;
  lpc_sprite_path: string;
  price: number;
}

export interface OwnedItem extends ShopItem {
  is_equipped: boolean;
  purchased_at: string;
}

// === API 응답 ===

export interface LoginResponse {
  token: string;
  teacher: Teacher;
}

export interface RegionDetailResponse {
  region: Region;
  npcs: NPC[];
  questions: Question[];
}

// === 대시보드 WebSocket ===

export interface DashboardUpdate {
  type: string;
  student_id: number;
  student_name: string;
  data: unknown;
}
