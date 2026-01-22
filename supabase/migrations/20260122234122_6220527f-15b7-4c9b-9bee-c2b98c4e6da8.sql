-- Table api_configs pour stocker les configurations n8n et autres APIs
CREATE TABLE public.api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  mode TEXT NOT NULL DEFAULT 'work',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own configs" ON public.api_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configs" ON public.api_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configs" ON public.api_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own configs" ON public.api_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_api_configs_updated_at
  BEFORE UPDATE ON public.api_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();