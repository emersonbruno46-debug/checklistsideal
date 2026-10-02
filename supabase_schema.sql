-- Ideal Checklist's Database Schema
-- Run this script in your Supabase SQL Editor to create tables, RLS policies, and triggers.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CHECKLIST TEMPLATES
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Checklist de Funcionalidades',
  source_file TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CHECKLIST SECTIONS
CREATE TABLE IF NOT EXISTS public.checklist_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

-- 5. CHECKLIST SCENARIOS
CREATE TABLE IF NOT EXISTS public.checklist_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.checklist_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  confidence FLOAT NOT NULL DEFAULT 0.95,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CHECKLIST STEPS
CREATE TABLE IF NOT EXISTS public.checklist_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES public.checklist_scenarios(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

-- 7. CHECKLIST ASSERTIONS (VALIDATIONS)
CREATE TABLE IF NOT EXISTS public.checklist_assertions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES public.checklist_scenarios(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.95,
  "order" INT NOT NULL DEFAULT 0
);

-- 8. LEGACY CATEGORIES
CREATE TABLE IF NOT EXISTS public.checklist_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

-- 9. LEGACY ITEMS
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.checklist_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TEST RUNS
CREATE TABLE IF NOT EXISTS public.test_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  checklist_template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  tester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tester_name TEXT NOT NULL DEFAULT 'Funcionário',
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'needs_review', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SCENARIO RESULTS
CREATE TABLE IF NOT EXISTS public.scenario_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_run_id UUID NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES public.checklist_scenarios(id) ON DELETE CASCADE,
  result TEXT NOT NULL DEFAULT 'unanswered' CHECK (result IN ('yes', 'no', 'caveat', 'unanswered')),
  note TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_run_scenario UNIQUE (test_run_id, scenario_id)
);

-- 12. ASSERTION RESULTS
CREATE TABLE IF NOT EXISTS public.assertion_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_result_id UUID NOT NULL REFERENCES public.scenario_results(id) ON DELETE CASCADE,
  assertion_id UUID NOT NULL REFERENCES public.checklist_assertions(id) ON DELETE CASCADE,
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending', 'passed', 'failed', 'caveat')),
  CONSTRAINT unique_scenario_assertion UNIQUE (scenario_result_id, assertion_id)
);

-- 13. LEGACY TEST ANSWERS
CREATE TABLE IF NOT EXISTS public.test_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_run_id UUID NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  result TEXT NOT NULL DEFAULT 'unanswered' CHECK (result IN ('yes', 'no', 'caveat', 'unanswered')),
  note TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_run_item UNIQUE (test_run_id, checklist_item_id)
);

-- 14. ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_answer_id UUID REFERENCES public.test_answers(id) ON DELETE CASCADE,
  scenario_result_id UUID REFERENCES public.scenario_results(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT NOT NULL DEFAULT 'image',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_sections_template ON public.checklist_sections(checklist_template_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_template ON public.checklist_scenarios(checklist_template_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_section ON public.checklist_scenarios(section_id);
CREATE INDEX IF NOT EXISTS idx_steps_scenario ON public.checklist_steps(scenario_id);
CREATE INDEX IF NOT EXISTS idx_assertions_scenario ON public.checklist_assertions(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_results_run ON public.scenario_results(test_run_id);
CREATE INDEX IF NOT EXISTS idx_assertion_results_scenario ON public.assertion_results(scenario_result_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.checklist_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_assertions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assertion_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sections editable by authenticated users" ON public.checklist_sections FOR ALL TO authenticated USING (true);
CREATE POLICY "Scenarios editable by authenticated users" ON public.checklist_scenarios FOR ALL TO authenticated USING (true);
CREATE POLICY "Steps editable by authenticated users" ON public.checklist_steps FOR ALL TO authenticated USING (true);
CREATE POLICY "Assertions editable by authenticated users" ON public.checklist_assertions FOR ALL TO authenticated USING (true);
CREATE POLICY "Scenario results editable by authenticated users" ON public.scenario_results FOR ALL TO authenticated USING (true);
CREATE POLICY "Assertion results editable by authenticated users" ON public.assertion_results FOR ALL TO authenticated USING (true);
