-- Seed data: shop items (15개)
INSERT INTO items (name, category, lpc_sprite_path, price) VALUES
  ('빨간 리본', 'hair', 'hair/ribbon_red.png', 20),
  ('마법사 모자', 'hat', 'hat/wizard.png', 40),
  ('왕관', 'hat', 'hat/crown_gold.png', 80),
  ('갑옷 상의', 'torso', 'torso/armor_silver.png', 60),
  ('빨간 망토', 'cape', 'cape/red.png', 50),
  ('파란 망토', 'cape', 'cape/blue.png', 50),
  ('나무 검', 'weapon', 'weapon/sword_wood.png', 30),
  ('마법 지팡이', 'weapon', 'weapon/staff_magic.png', 70),
  ('가죽 부츠', 'feet', 'feet/boots_leather.png', 25),
  ('은색 레깅스', 'legs', 'legs/leggings_silver.png', 45),
  ('초록 치마', 'legs', 'legs/skirt_green.png', 35),
  ('금색 어깨갑옷', 'torso', 'torso/shoulders_gold.png', 90),
  ('검은 부츠', 'feet', 'feet/boots_black.png', 30),
  ('보라 머리띠', 'hair', 'hair/band_purple.png', 25),
  ('철 방패', 'weapon', 'weapon/shield_iron.png', 100)
ON CONFLICT DO NOTHING;
