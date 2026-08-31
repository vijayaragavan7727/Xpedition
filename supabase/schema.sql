-- XPedition Supabase Database Schema Migration

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  share_id UUID DEFAULT gen_random_uuid(),
  timezone TEXT DEFAULT 'UTC',
  motivation_type TEXT DEFAULT 'trophy',
  current_status TEXT,
  year_and_branch TEXT,
  learner_rating TEXT,
  last_exam_marks TEXT,
  learning_style TEXT DEFAULT 'story',
  daily_time TEXT DEFAULT '30 min',
  interests JSONB DEFAULT '[]'::jsonb,
  accessibility_settings JSONB DEFAULT '{"focusMode": false, "dyslexiaFriendly": false, "reducedMotion": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  title TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Skills Table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  difficulty INT NOT NULL DEFAULT 1,
  source_url TEXT,
  order_index INT NOT NULL DEFAULT 0
);

-- 4. Mastery Table (Spaced Repetition & BKT)
CREATE TABLE IF NOT EXISTS public.mastery (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  p_know FLOAT DEFAULT 0.15,
  attempts INT DEFAULT 0,
  half_life_hours FLOAT DEFAULT 48.0,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- 5. Attempts Table
CREATE TABLE IF NOT EXISTS public.attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id UUID,
  correct BOOLEAN NOT NULL,
  latency_ms INT DEFAULT 0,
  hints_used INT DEFAULT 0,
  difficulty INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Game State Table
CREATE TABLE IF NOT EXISTS public.game_state (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  streak_days INT DEFAULT 0,
  longest_streak INT DEFAULT 1,
  streak_freezes INT DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE
);

-- 7. Reward Arms Table (Multi-Armed Bandit)
CREATE TABLE IF NOT EXISTS public.reward_arms (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  arm TEXT NOT NULL,
  alpha FLOAT DEFAULT 1.0,
  beta FLOAT DEFAULT 1.0,
  pulls INT DEFAULT 0,
  returns INT DEFAULT 0,
  PRIMARY KEY (user_id, arm)
);

-- 8. Guilds Table
CREATE TABLE IF NOT EXISTS public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Guild Members Table
CREATE TABLE IF NOT EXISTS public.guild_members (
  guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (guild_id, user_id)
);

-- 10. Peer Quests Table
CREATE TABLE IF NOT EXISTS public.peer_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  plays INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10b. Served Questions Table (Anti-Repetition Engine)
CREATE TABLE IF NOT EXISTS public.served_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  prompt TEXT NOT NULL,
  skill_id TEXT,
  skill_name TEXT,
  served_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_served_questions_user_hash ON public.served_questions(user_id, question_hash);
CREATE INDEX IF NOT EXISTS idx_served_questions_user_skill ON public.served_questions(user_id, skill_name, served_at DESC);

-- 11. Matchmaking Queue Table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  difficulty INT DEFAULT 2,
  status TEXT DEFAULT 'queued',
  matched_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Raid Sessions Table
CREATE TABLE IF NOT EXISTS public.raid_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL,
  player1_name TEXT NOT NULL,
  player2_id UUID NOT NULL,
  player2_name TEXT NOT NULL,
  is_ai_partner BOOLEAN DEFAULT FALSE,
  boss_hp INT DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Passport Snapshots Table (Cryptographically Verified Credentials)
CREATE TABLE IF NOT EXISTS public.passport_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  share_id UUID NOT NULL,
  goal_title TEXT NOT NULL,
  skills_json JSONB NOT NULL,
  overall_readiness FLOAT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Learning Modules Table (Learn-Then-Test Platform)
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  learning_style TEXT NOT NULL DEFAULT 'story',
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  takeaways JSONB NOT NULL,
  sources JSONB NOT NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_modules_skill_level_style ON public.modules(skill_id, level, learning_style);

-- 15. User Module Progress Table
CREATE TABLE IF NOT EXISTS public.user_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  read_completed BOOLEAN DEFAULT FALSE,
  test_passed BOOLEAN DEFAULT FALSE,
  score INT DEFAULT 0,
  attempts INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_module_progress ON public.user_module_progress(user_id, skill_id, level);

-- 14. Experiment Assignments Table (A/B Learning Gain Harness)
CREATE TABLE IF NOT EXISTS public.experiment_assignments (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  cohort TEXT NOT NULL CHECK (cohort IN ('adaptive', 'control')),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Pre/Post Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('pre', 'post')),
  score FLOAT NOT NULL,
  max_score FLOAT NOT NULL DEFAULT 5.0,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_arms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raid_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Strict RLS Policies for User-Owned Tables
CREATE POLICY "Users can manage own mastery" ON public.mastery
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own attempts" ON public.attempts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own game_state" ON public.game_state
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own reward_arms" ON public.reward_arms
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own passport_snapshots" ON public.passport_snapshots
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public Unauthenticated Read Access for Passport Snapshots by share_id
CREATE POLICY "Allow public read access for passport_snapshots by share_id" ON public.passport_snapshots
  FOR SELECT USING (true);

-- Permissive RLS Policies for other features demo
CREATE POLICY "Allow full access for users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow full access for goals" ON public.goals FOR ALL USING (true);
CREATE POLICY "Allow full access for skills" ON public.skills FOR ALL USING (true);
CREATE POLICY "Allow full access for guilds" ON public.guilds FOR ALL USING (true);
CREATE POLICY "Allow full access for guild_members" ON public.guild_members FOR ALL USING (true);
CREATE POLICY "Allow full access for peer_quests" ON public.peer_quests FOR ALL USING (true);
CREATE POLICY "Allow full access for matchmaking_queue" ON public.matchmaking_queue FOR ALL USING (true);
CREATE POLICY "Allow full access for raid_sessions" ON public.raid_sessions FOR ALL USING (true);
CREATE POLICY "Allow full access for experiment_assignments" ON public.experiment_assignments FOR ALL USING (true);
CREATE POLICY "Allow full access for assessments" ON public.assessments FOR ALL USING (true);

-- 12. Study Sessions Table
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id TEXT,
  goal_title TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  questions_answered INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  skills_touched JSONB DEFAULT '[]'::jsonb,
  last_skill_id TEXT,
  last_skill_name TEXT,
  xp_earned INT DEFAULT 0,
  ended_reason TEXT DEFAULT 'completed'
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access for study_sessions" ON public.study_sessions FOR ALL USING (true);

-- 13. World State Table (Learning-Driven World System Phase 1)
CREATE TABLE IF NOT EXISTS public.world_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skill_graph_id TEXT NOT NULL,
  world_theme TEXT NOT NULL DEFAULT 'cosmos',
  total_mastery_percent INT NOT NULL DEFAULT 0,
  tier INT NOT NULL DEFAULT 1,
  buildings JSONB NOT NULL DEFAULT '[]'::jsonb,
  lps_score NUMERIC DEFAULT 0,
  lps_tier INT DEFAULT 1,
  lps_profile TEXT DEFAULT 'scholar',
  unlocked_areas TEXT[] DEFAULT '{central}',
  resources JSONB DEFAULT '{"wood":0,"stone":0,"crystal":0,"gold":0}'::jsonb,
  active_missions JSONB DEFAULT '[]'::jsonb,
  last_evolved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_graph_id)
);

ALTER TABLE public.world_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own world state" ON public.world_state
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow full access for world_state" ON public.world_state FOR ALL USING (true);



