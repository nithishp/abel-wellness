// WhatsApp Conversation State Manager
// Manages conversation state in Supabase for the chatbot

import { supabaseAdmin } from "@/lib/supabase.config";
import { WA_TABLES } from "./constants";

// Get or create a conversation for a phone number
export async function getOrCreateConversation(phone) {
  // Try to get existing conversation
  const { data: existing } = await supabaseAdmin
    .from(WA_TABLES.CONVERSATIONS)
    .select("*")
    .eq("phone", phone)
    .single();

  if (existing) {
    // Update last_message_at
    await supabaseAdmin
      .from(WA_TABLES.CONVERSATIONS)
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing;
  }

  // Create new conversation
  const { data: newConvo, error } = await supabaseAdmin
    .from(WA_TABLES.CONVERSATIONS)
    .insert({
      phone,
      current_step: "idle",
      context: {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }

  return newConvo;
}

// Update conversation state
export async function updateConversation(conversationId, updates) {
  const { data, error } = await supabaseAdmin
    .from(WA_TABLES.CONVERSATIONS)
    .update({
      ...updates,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating conversation:", error);
    throw error;
  }

  return data;
}

// Reset conversation to idle
export async function resetConversation(conversationId) {
  return updateConversation(conversationId, {
    current_step: "idle",
    flow: null,
    context: {},
  });
}

// Update just the context (merge with existing)
export async function updateContext(conversationId, contextUpdates) {
  const { data: convo } = await supabaseAdmin
    .from(WA_TABLES.CONVERSATIONS)
    .select("context")
    .eq("id", conversationId)
    .single();

  const mergedContext = { ...(convo?.context || {}), ...contextUpdates };

  return updateConversation(conversationId, { context: mergedContext });
}

// Link conversation to a user
export async function linkConversationToUser(conversationId, userId) {
  return supabaseAdmin
    .from(WA_TABLES.CONVERSATIONS)
    .update({ user_id: userId })
    .eq("id", conversationId);
}

// Log a message (inbound or outbound)
export async function logMessage(
  conversationId,
  phone,
  direction,
  content,
  messageType = "text",
  waMessageId = null,
  metadata = {},
) {
  const { error } = await supabaseAdmin.from(WA_TABLES.MESSAGES).insert({
    conversation_id: conversationId,
    phone,
    direction,
    message_type: messageType,
    content,
    wa_message_id: waMessageId,
    metadata,
  });

  if (error) {
    console.error("Error logging message:", error);
  }
}
