-- Enable Realtime subscription on chat_history table
-- Allows real-time synchronization of messages across devices

ALTER PUBLICATION supabase_realtime ADD TABLE chat_history;

-- Add comment for documentation
COMMENT ON PUBLICATION supabase_realtime IS 'Realtime publication for chat_history table - enables multi-device sync';
