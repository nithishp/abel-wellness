-- WhatsApp Chatbot Conversations - tracks conversation state per phone number
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  current_step VARCHAR NOT NULL DEFAULT 'idle',
  flow VARCHAR DEFAULT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone)
);

-- WhatsApp Message Log - stores all messages for audit/debugging
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  phone VARCHAR NOT NULL,
  direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type VARCHAR NOT NULL DEFAULT 'text',
  content TEXT,
  wa_message_id VARCHAR,
  status VARCHAR DEFAULT 'sent',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Scheduled Messages - for reminders and follow-ups
CREATE TABLE IF NOT EXISTS whatsapp_scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message_type VARCHAR NOT NULL,
  template_name VARCHAR,
  template_params JSONB DEFAULT '{}'::jsonb,
  related_type VARCHAR,
  related_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_wa_conversations_phone ON whatsapp_conversations(phone);
CREATE INDEX idx_wa_conversations_user_id ON whatsapp_conversations(user_id);
CREATE INDEX idx_wa_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX idx_wa_messages_phone ON whatsapp_messages(phone);
CREATE INDEX idx_wa_messages_created_at ON whatsapp_messages(created_at);
CREATE INDEX idx_wa_scheduled_status ON whatsapp_scheduled_messages(status, scheduled_at);
CREATE INDEX idx_wa_scheduled_phone ON whatsapp_scheduled_messages(phone);

-- Updated_at trigger for conversations
CREATE OR REPLACE FUNCTION update_wa_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wa_conversation_updated
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_wa_conversation_timestamp();
