-- Create segments table for dynamic segment management
CREATE TABLE public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder-kanban',
  color TEXT NOT NULL DEFAULT '#6366f1',
  mode TEXT NOT NULL CHECK (mode IN ('work', 'personal')) DEFAULT 'work',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, slug, mode)
);

-- Enable RLS
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own segments" ON public.segments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own segments" ON public.segments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own segments" ON public.segments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete non-default segments" ON public.segments
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Trigger for updated_at
CREATE TRIGGER update_segments_updated_at
  BEFORE UPDATE ON public.segments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to seed default segments for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_segments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Work segments
  INSERT INTO public.segments (user_id, name, slug, icon, color, mode, order_index, is_default) VALUES
    (NEW.id, 'E-commerce', 'ecommerce', 'shopping-cart', '#22c55e', 'work', 1, true),
    (NEW.id, 'TikTok', 'tiktok', 'video', '#a855f7', 'work', 2, true),
    (NEW.id, 'Consulting', 'consulting', 'briefcase', '#3b82f6', 'work', 3, true),
    (NEW.id, 'Oracle', 'oracle', 'sparkles', '#f97316', 'work', 4, true),
    (NEW.id, 'Dream App', 'tech', 'smartphone', '#ec4899', 'work', 5, true),
    (NEW.id, 'Les Enquêtes', 'data', 'search', '#06b6d4', 'work', 6, true),
    (NEW.id, 'Autre', 'other', 'folder-kanban', '#64748b', 'work', 99, true),
    -- Personal segments
    (NEW.id, 'Hobbies', 'hobby', 'palette', '#f97316', 'personal', 1, true),
    (NEW.id, 'Bien-être', 'wellness', 'heart', '#06b6d4', 'personal', 2, true),
    (NEW.id, 'Voyages', 'travel', 'plane', '#3b82f6', 'personal', 3, true),
    (NEW.id, 'Autre', 'other', 'folder-kanban', '#64748b', 'personal', 99, true);
  
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created_segments
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_segments();

-- Seed segments for existing users
INSERT INTO public.segments (user_id, name, slug, icon, color, mode, order_index, is_default)
SELECT 
  p.user_id,
  s.name,
  s.slug,
  s.icon,
  s.color,
  s.mode,
  s.order_index,
  true
FROM public.profiles p
CROSS JOIN (
  VALUES 
    ('E-commerce', 'ecommerce', 'shopping-cart', '#22c55e', 'work', 1),
    ('TikTok', 'tiktok', 'video', '#a855f7', 'work', 2),
    ('Consulting', 'consulting', 'briefcase', '#3b82f6', 'work', 3),
    ('Oracle', 'oracle', 'sparkles', '#f97316', 'work', 4),
    ('Dream App', 'tech', 'smartphone', '#ec4899', 'work', 5),
    ('Les Enquêtes', 'data', 'search', '#06b6d4', 'work', 6),
    ('Autre', 'other', 'folder-kanban', '#64748b', 'work', 99),
    ('Hobbies', 'hobby', 'palette', '#f97316', 'personal', 1),
    ('Bien-être', 'wellness', 'heart', '#06b6d4', 'personal', 2),
    ('Voyages', 'travel', 'plane', '#3b82f6', 'personal', 3),
    ('Autre', 'other', 'folder-kanban', '#64748b', 'personal', 99)
) AS s(name, slug, icon, color, mode, order_index)
ON CONFLICT (user_id, slug, mode) DO NOTHING;