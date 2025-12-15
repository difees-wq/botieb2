-- Migration: add chatbot session state fields to chat_session
-- Do not remove or rename existing columns

ALTER TABLE public.chat_session
  ADD COLUMN IF NOT EXISTS state JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS current_node_id VARCHAR(50) DEFAULT 'N1',
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP DEFAULT NOW();

-- Indexes to speed up lookups and activity queries
CREATE INDEX IF NOT EXISTS idx_chat_session_visitor_hash
  ON public.chat_session(visitante_hash);

CREATE INDEX IF NOT EXISTS idx_chat_session_last_interaction
  ON public.chat_session(last_interaction_at);
