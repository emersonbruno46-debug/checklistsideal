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

-- 4. CHECKLIST CATEGORIES
CREATE TABLE IF NOT EXISTS public.checklist_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

-- 5. CHECKLIST ITEMS
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.checklist_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TEST RUNS
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

-- 7. TEST ANSWERS
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

-- 8. ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_answer_id UUID NOT NULL REFERENCES public.test_answers(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT NOT NULL DEFAULT 'image',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_project_id ON public.checklist_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_template ON public.checklist_items(checklist_template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON public.checklist_items(category_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_project ON public.test_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_test_answers_run ON public.test_answers(test_run_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR AUTHENTICATED USERS
-- Allow authenticated users to view profiles
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects RLS
CREATE POLICY "Projects viewable by authenticated users" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Projects editable by authenticated users" ON public.projects FOR ALL TO authenticated USING (true);

-- Templates RLS
CREATE POLICY "Templates viewable by authenticated users" ON public.checklist_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Templates editable by authenticated users" ON public.checklist_templates FOR ALL TO authenticated USING (true);

-- Categories RLS
CREATE POLICY "Categories viewable by authenticated users" ON public.checklist_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Categories editable by authenticated users" ON public.checklist_categories FOR ALL TO authenticated USING (true);

-- Items RLS
CREATE POLICY "Items viewable by authenticated users" ON public.checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Items editable by authenticated users" ON public.checklist_items FOR ALL TO authenticated USING (true);

-- Test Runs RLS
CREATE POLICY "Test runs viewable by authenticated users" ON public.test_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Test runs editable by authenticated users" ON public.test_runs FOR ALL TO authenticated USING (true);

-- Test Answers RLS
CREATE POLICY "Test answers viewable by authenticated users" ON public.test_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Test answers editable by authenticated users" ON public.test_answers FOR ALL TO authenticated USING (true);

-- Attachments RLS
CREATE POLICY "Attachments viewable by authenticated users" ON public.attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Attachments editable by authenticated users" ON public.attachments FOR ALL TO authenticated USING (true);

-- SUPABASE STORAGE BUCKET FOR EVIDENCES
-- Create 'evidences' bucket in Supabase Storage UI if needed
