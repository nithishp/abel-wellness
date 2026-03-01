-- Add opt_out column to whatsapp_conversations for STOP/START messaging control
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS opted_out BOOLEAN DEFAULT FALSE;

-- Add status column default tracking to whatsapp_messages
COMMENT ON COLUMN whatsapp_messages.status IS 'Message delivery status: sent, delivered, read, failed';

-- Add updated_at column to whatsapp_scheduled_messages for better tracking
ALTER TABLE whatsapp_scheduled_messages
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for updated_at on whatsapp_scheduled_messages
CREATE OR REPLACE FUNCTION update_whatsapp_scheduled_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_whatsapp_scheduled_updated_at ON whatsapp_scheduled_messages;
CREATE TRIGGER set_whatsapp_scheduled_updated_at
  BEFORE UPDATE ON whatsapp_scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_scheduled_updated_at();
