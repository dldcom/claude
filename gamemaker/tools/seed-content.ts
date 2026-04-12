import dotenv from 'dotenv';
import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../server/.env') });

// ---- Type definitions ----

interface QuestionContent {
  type: string;
  sentence?: string;
  options?: string[];
  [key: string]: unknown;
}

interface Question {
  content: QuestionContent;
  correct_answer: string;
  coin_reward: number;
}

interface Npc {
  name: string;
  character_desc: string;
  story_phase: string;
  position_x: number;
  position_y: number;
  quiz_type: string;
  quiz_difficulty: string;
  sort_order: number;
  dialogue_before: string[];
  dialogue_correct: string[];
  dialogue_wrong: string[];
  dialogue_after: string[];
  next_npc_hint: string | null;
  questions: Question[];
}

interface Region {
  name: string;
  theme: string;
  sort_order: number;
  intro_dialogue: string[];
  ending_dialogue: string[];
  epilogue_dialogue: string[];
  story_synopsis: string;
}

interface StoryConfig {
  region: Region;
  npcs: Npc[];
}

// ---- Helpers ----

function findStoryConfigs(baseDir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(baseDir);
  for (const entry of entries) {
    const fullPath = join(baseDir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findStoryConfigs(fullPath));
    } else if (entry.endsWith('_story_config.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function seedFile(client: pg.Client, filePath: string): Promise<void> {
  console.log(`\n[seed] Processing: ${filePath}`);
  const raw = readFileSync(filePath, 'utf-8');
  const config: StoryConfig = JSON.parse(raw);
  const { region, npcs } = config;

  // Check if region already exists
  const existing = await client.query<{ id: number }>(
    `SELECT id FROM regions WHERE name = $1`,
    [region.name]
  );

  if (existing.rows.length > 0) {
    console.log(`  [skip] Region already exists: "${region.name}" (id=${existing.rows[0].id})`);
    return;
  }

  // Insert region
  const regionResult = await client.query<{ id: number }>(
    `INSERT INTO regions (name, theme, sort_order, intro_dialogue, ending_dialogue, epilogue_dialogue, story_synopsis)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      region.name,
      region.theme,
      region.sort_order,
      JSON.stringify(region.intro_dialogue),
      JSON.stringify(region.ending_dialogue),
      JSON.stringify(region.epilogue_dialogue),
      region.story_synopsis,
    ]
  );

  const regionId = regionResult.rows[0].id;
  console.log(`  [ok]   Region inserted: "${region.name}" (id=${regionId})`);

  // Insert each NPC and its questions
  for (const npc of npcs) {
    const npcResult = await client.query<{ id: number }>(
      `INSERT INTO npcs
         (region_id, name, character_desc, story_phase, position_x, position_y,
          quiz_type, quiz_difficulty, sort_order,
          dialogue_before, dialogue_correct, dialogue_wrong, dialogue_after, next_npc_hint)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        regionId,
        npc.name,
        npc.character_desc,
        npc.story_phase,
        npc.position_x,
        npc.position_y,
        npc.quiz_type,
        npc.quiz_difficulty,
        npc.sort_order,
        JSON.stringify(npc.dialogue_before),
        JSON.stringify(npc.dialogue_correct),
        JSON.stringify(npc.dialogue_wrong),
        JSON.stringify(npc.dialogue_after),
        npc.next_npc_hint,
      ]
    );

    const npcId = npcResult.rows[0].id;
    console.log(`  [ok]   NPC inserted: "${npc.name}" (id=${npcId})`);

    for (const question of npc.questions) {
      const qResult = await client.query<{ id: number }>(
        `INSERT INTO questions (npc_id, content, correct_answer, coin_reward)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [npcId, JSON.stringify(question.content), question.correct_answer, question.coin_reward]
      );
      console.log(`    [ok] Question inserted (id=${qResult.rows[0].id}): "${question.correct_answer}"`);
    }
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('[error] DATABASE_URL is not set. Check server/.env');
    process.exit(1);
  }

  const contentDir = join(__dirname, '../content');
  console.log(`[seed] Scanning content directory: ${contentDir}`);

  const configFiles = findStoryConfigs(contentDir);
  if (configFiles.length === 0) {
    console.log('[seed] No *_story_config.json files found.');
    return;
  }
  console.log(`[seed] Found ${configFiles.length} config file(s).`);

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('[seed] Connected to database.');

  try {
    for (const filePath of configFiles) {
      await seedFile(client, filePath);
    }
    console.log('\n[seed] Done.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
