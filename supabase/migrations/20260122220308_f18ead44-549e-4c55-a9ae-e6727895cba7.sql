-- ============================================
-- TABLE: transactions
-- Suivi des revenus/dépenses avec segments et objectif 2026
-- ============================================
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  segment TEXT NOT NULL CHECK (segment IN ('ecommerce', 'tiktok', 'consulting', 'oracle', 'other')),
  category TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mode TEXT NOT NULL DEFAULT 'work' CHECK (mode IN ('work', 'personal')),
  -- Champ pour tracker si ça compte vers l'objectif 2026
  counts_toward_goal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for performance
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_segment ON public.transactions(segment);

-- ============================================
-- TABLE: projects
-- Gestion des projets avec segments et progression
-- ============================================
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  segment TEXT NOT NULL CHECK (segment IN ('ecommerce', 'tiktok', 'consulting', 'oracle', 'other')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline DATE,
  mode TEXT NOT NULL DEFAULT 'work' CHECK (mode IN ('work', 'personal')),
  budget DECIMAL(12, 2),
  revenue_generated DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for performance
CREATE INDEX idx_projects_user_status ON public.projects(user_id, status);
CREATE INDEX idx_projects_segment ON public.projects(segment);

-- ============================================
-- TABLE: tasks
-- Gestion des tâches avec temps estimé/passé pour ROI
-- ============================================
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  -- Champs pour le tracking ROI personnel
  estimated_time INTEGER NOT NULL DEFAULT 0, -- en minutes
  time_spent INTEGER NOT NULL DEFAULT 0, -- en minutes
  mode TEXT NOT NULL DEFAULT 'work' CHECK (mode IN ('work', 'personal')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for performance
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- ============================================
-- TABLE: user_goals (pour stocker l'objectif 1M€)
-- ============================================
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  annual_revenue_goal DECIMAL(12, 2) NOT NULL DEFAULT 1000000,
  annual_projects_goal INTEGER NOT NULL DEFAULT 12,
  year INTEGER NOT NULL DEFAULT 2026,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own goals" ON public.user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();