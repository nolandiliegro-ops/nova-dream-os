-- Create chat_history table for Nova Brain V5.2
-- Stores conversation history with multi-device persistence

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_project 
ON chat_history(user_id, project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_created_at 
ON chat_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id 
ON chat_history(user_id);

-- Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chat history"
ON chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON chat_history FOR DELETE
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE chat_history IS 'Stores conversation history with Nova AI assistant. Supports multi-device persistence and realtime synchronization.';
COMMENT ON COLUMN chat_history.role IS 'Message sender role: user or assistant';
COMMENT ON COLUMN chat_history.attachments IS 'JSON array of attached documents (file paths, URLs, metadata)';
