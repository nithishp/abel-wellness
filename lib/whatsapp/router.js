// WhatsApp Chatbot — Main Message Router
// Routes incoming messages to the appropriate flow handler

import { sendTextMessage, sendButtonMessage, markAsRead } from "./service";
import { getOrCreateConversation, resetConversation, logMessage } from "./conversation";
import { FLOWS, ACTIONS, BOOKING_STEPS, STATUS_STEPS, CANCEL_STEPS, RESCHEDULE_STEPS } from "./constants";
import { startBookingFlow, handleBookingStep } from "./flows/booking";
import { startStatusFlow, handleStatusStep, startCancelFlow, handleCancelStep, startRescheduleFlow, handleRescheduleStep } from "./flows/manage";
import * as templates from "./templates";

// Timeout for conversation inactivity (30 minutes)
const CONVERSATION_TIMEOUT_MS = 30 * 60 * 1000;

// Extract message content and type from webhook payload
export function parseIncomingMessage(message) {
  if (!message) return null;

  const base = {
    from: message.from,
    messageId: message.id,
    timestamp: message.timestamp,
  };

  if (message.type === "text") {
    return {
      ...base,
      type: "text",
      content: message.text?.body || "",
    };
  }

  if (message.type === "interactive") {
    const interactive = message.interactive;
    if (interactive?.type === "button_reply") {
      return {
        ...base,
        type: "interactive",
        content: interactive.button_reply?.id || "",
        title: interactive.button_reply?.title || "",
      };
    }
    if (interactive?.type === "list_reply") {
      return {
        ...base,
        type: "interactive",
        content: interactive.list_reply?.id || "",
        title: interactive.list_reply?.title || "",
      };
    }
  }

  // Unsupported message types (image, audio, etc.)
  return {
    ...base,
    type: "unsupported",
    content: `[${message.type} message]`,
  };
}

// Main router — handles every incoming message
export async function handleIncomingMessage(parsedMessage) {
  const { from: phone, content, type, messageId } = parsedMessage;

  try {
    // Mark as read
    if (messageId) {
      await markAsRead(messageId);
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(phone);

    // Log inbound message
    await logMessage(conversation.id, phone, "inbound", content, type, messageId);

    // Check for unsupported message type
    if (type === "unsupported") {
      await sendTextMessage(phone, "Sorry, I can only process text messages and button/list selections at the moment.\n\n_Type \"menu\" to see what I can help with._");
      return;
    }

    // Check for conversation timeout
    if (conversation.flow && conversation.current_step !== "idle") {
      const lastMessage = new Date(conversation.last_message_at);
      if (Date.now() - lastMessage.getTime() > CONVERSATION_TIMEOUT_MS) {
        await resetConversation(conversation.id);
        await sendTextMessage(phone, templates.sessionExpired());
        return;
      }
    }

    // Normalize text for command matching
    const textLower = content.toLowerCase().trim();

    // Global commands — these work from any state
    if (isMenuCommand(textLower, type, content)) {
      await resetConversation(conversation.id);
      return await showMainMenu(conversation, phone);
    }

    if (isGreeting(textLower) && conversation.current_step === "idle") {
      return await showWelcome(conversation, phone);
    }

    // Global shortcuts
    if (textLower === "book" || textLower === "appointment" || textLower === "1") {
      if (conversation.current_step === "idle") {
        return await startBookingFlow(conversation, phone);
      }
    }

    if (textLower === "status" || textLower === "check" || textLower === "2") {
      if (conversation.current_step === "idle") {
        return await startStatusFlow(conversation, phone);
      }
    }

    if ((textLower === "cancel" && conversation.current_step === "idle") || textLower === "3") {
      if (conversation.current_step === "idle") {
        return await startCancelFlow(conversation, phone);
      }
    }

    if (textLower === "reschedule" || textLower === "4") {
      if (conversation.current_step === "idle") {
        return await startRescheduleFlow(conversation, phone);
      }
    }

    if (textLower === "help" || textLower === "5") {
      if (conversation.current_step === "idle") {
        await sendTextMessage(phone, templates.helpMessage());
        return;
      }
    }

    // Handle interactive button/list responses for main menu
    if (type === "interactive") {
      return await handleInteractiveAction(conversation, phone, content);
    }

    // Cancel current flow
    if (textLower === "cancel" && conversation.current_step !== "idle") {
      await resetConversation(conversation.id);
      await sendTextMessage(phone, "Current action cancelled.\n\n_Type \"menu\" to see options._");
      return;
    }

    // Route to active flow
    if (conversation.flow && conversation.current_step !== "idle") {
      return await routeToFlow(conversation, phone, content, type);
    }

    // No active flow, show menu
    return await showMainMenu(conversation, phone);
  } catch (error) {
    console.error("Error handling message:", error);
    await sendTextMessage(phone, "Sorry, something went wrong. Please try again.\n\n_Type \"menu\" to start over._");
  }
}

function isMenuCommand(text, type, rawContent) {
  if (type === "interactive" && rawContent === ACTIONS.MAIN_MENU) return true;
  return ["menu", "main menu", "home", "start"].includes(text);
}

function isGreeting(text) {
  return ["hi", "hello", "hey", "namaste", "good morning", "good afternoon", "good evening", "hola"].includes(text);
}

async function showWelcome(conversation, phone) {
  await sendTextMessage(phone, templates.welcomeMessage());

  // Show menu with buttons
  await sendButtonMessage(
    phone,
    templates.mainMenuText(),
    [
      { id: ACTIONS.BOOK_APPOINTMENT, title: "📅 Book Appointment" },
      { id: ACTIONS.CHECK_STATUS, title: "📋 Check Status" },
      { id: ACTIONS.HELP, title: "ℹ️ Help" },
    ],
    null,
    "Abel Wellness"
  );
}

async function showMainMenu(conversation, phone) {
  await sendButtonMessage(
    phone,
    templates.mainMenuText(),
    [
      { id: ACTIONS.BOOK_APPOINTMENT, title: "📅 Book Appointment" },
      { id: ACTIONS.CHECK_STATUS, title: "📋 Check Status" },
      { id: ACTIONS.HELP, title: "ℹ️ Help" },
    ],
    "Abel Wellness",
    "Reply with a number or tap a button"
  );
}

async function handleInteractiveAction(conversation, phone, actionId) {
  // If in a flow, route there
  if (conversation.flow && conversation.current_step !== "idle") {
    return await routeToFlow(conversation, phone, actionId, "interactive");
  }

  // Main menu actions
  switch (actionId) {
    case ACTIONS.BOOK_APPOINTMENT:
      return await startBookingFlow(conversation, phone);
    case ACTIONS.CHECK_STATUS:
      return await startStatusFlow(conversation, phone);
    case ACTIONS.CANCEL_APPOINTMENT:
      return await startCancelFlow(conversation, phone);
    case ACTIONS.RESCHEDULE:
      return await startRescheduleFlow(conversation, phone);
    case ACTIONS.HELP:
      await sendTextMessage(phone, templates.helpMessage());
      return;
    case ACTIONS.MAIN_MENU:
      return await showMainMenu(conversation, phone);
    default:
      // Unknown action — show menu
      return await showMainMenu(conversation, phone);
  }
}

async function routeToFlow(conversation, phone, content, messageType) {
  const { flow, current_step } = conversation;

  switch (flow) {
    case FLOWS.BOOKING:
      return await handleBookingStep(conversation, phone, content, messageType);

    case FLOWS.STATUS:
      return await handleStatusStep(conversation, phone, content);

    case FLOWS.CANCEL:
      return await handleCancelStep(conversation, phone, content, messageType);

    case FLOWS.RESCHEDULE:
      return await handleRescheduleStep(conversation, phone, content, messageType);

    default:
      // Unknown flow — reset and show menu
      await resetConversation(conversation.id);
      return await showMainMenu(conversation, phone);
  }
}
