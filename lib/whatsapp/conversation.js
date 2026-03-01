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
    // Fire-and-forget — update last_message_at without blocking the flow
    supabaseAdmin
      .from(WA_TABLES.CONVERSATIONS)
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", existing.id)
      .then(() => {})
      .catch((err) => console.error("last_message_at update error:", err));
    return existing;
  }

  // Create new conversation (with race condition handling)
  try {
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
      // If unique constraint violation, another request created it — fetch it
      if (error.code === "23505") {
        const { data: raceConvo } = await supabaseAdmin
          .from(WA_TABLES.CONVERSATIONS)
          .select("*")
          .eq("phone", phone)
          .single();
        if (raceConvo) return raceConvo;
      }
      console.error("Error creating conversation:", error);
      throw error;
    }

    return newConvo;
  } catch (error) {
    // Final fallback: try to fetch again
    const { data: fallbackConvo } = await supabaseAdmin
      .from(WA_TABLES.CONVERSATIONS)
      .select("*")
      .eq("phone", phone)
      .single();
    if (fallbackConvo) return fallbackConvo;
    throw error;
  }
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
// Pass currentContext from the conversation already in scope to avoid an extra SELECT.
export async function updateContext(
  conversationId,
  contextUpdates,
  currentContext,
) {
  if (currentContext !== undefined) {
    // Fast path — caller already has the context, no extra SELECT needed
    const merged = { ...currentContext, ...contextUpdates };
    return updateConversation(conversationId, { context: merged });
  }

  // Slow path fallback — fetch context first (only when currentContext not passed)
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

// Log a message (inbound or outbound) — non-blocking fire-and-forget
export function logMessage(
  conversationId,
  phone,
  direction,
  content,
  messageType = "text",
  waMessageId = null,
  metadata = {},
) {
  // Do not await — message logging must never slow down the response
  supabaseAdmin
    .from(WA_TABLES.MESSAGES)
    .insert({
      conversation_id: conversationId,
      phone,
      direction,
      message_type: messageType,
      content,
      wa_message_id: waMessageId,
      status: direction === "inbound" ? "received" : "sent",
      metadata,
    })
    .then(() => {})
    .catch((err) => console.error("Error logging message:", err));
}
