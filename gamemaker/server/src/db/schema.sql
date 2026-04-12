-- LPC RPG Database Schema

CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  login_id VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  school_year VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  avatar_config JSONB DEFAULT '{}',
  coins INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  theme VARCHAR,
  intro_dialogue JSONB DEFAULT '[]',
  ending_dialogue JSONB DEFAULT '[]',
  epilogue_dialogue JSONB DEFAULT '[]',
  story_synopsis TEXT,
  map_data JSONB,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS npcs (
  id SERIAL PRIMARY KEY,
  region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  character_desc TEXT,
  story_phase VARCHAR NOT NULL,
  dialogue_before JSONB NOT NULL DEFAULT '[]',
  dialogue_correct JSONB NOT NULL DEFAULT '[]',
  dialogue_wrong JSONB NOT NULL DEFAULT '[]',
  dialogue_after JSONB NOT NULL DEFAULT '[]',
  next_npc_hint TEXT,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  quiz_type VARCHAR NOT NULL,
  quiz_difficulty VARCHAR NOT NULL DEFAULT 'normal',
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  npc_id INTEGER NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  correct_answer VARCHAR NOT NULL,
  coin_reward INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS student_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  npc_id INTEGER NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  is_cleared BOOLEAN DEFAULT FALSE,
  cleared_at TIMESTAMP,
  UNIQUE(student_id, npc_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer VARCHAR,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  lpc_sprite_path VARCHAR NOT NULL,
  price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS student_items (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, item_id)
);
