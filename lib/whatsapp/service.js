// WhatsApp Business Cloud API Service
// Handles all outbound messaging via Meta's WhatsApp Business API

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp credentials not configured");
  }
  return { accessToken, phoneNumberId };
}

function cleanPhone(phone) {
  return phone.replace(/[\s\-+]/g, "");
}

// Core send function — all other helpers use this
async function sendWhatsAppRequest(phoneNumberId, accessToken, body) {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API error:", JSON.stringify(data, null, 2));
    return {
      success: false,
      error: data.error?.message || "Unknown WhatsApp API error",
      status: response.status,
    };
  }

  return {
    success: true,
    messageId: data.messages?.[0]?.id,
    data,
  };
}

// Send a plain text message
export async function sendTextMessage(to, text) {
  try {
    const { accessToken, phoneNumberId } = getConfig();
    return await sendWhatsAppRequest(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone(to),
      type: "text",
      text: { preview_url: false, body: text },
    });
  } catch (error) {
    console.error("sendTextMessage error:", error);
    return { success: false, error: error.message };
  }
}

// Send interactive buttons (max 3 buttons)
export async function sendButtonMessage(to, bodyText, buttons, headerText = null, footerText = null) {
  try {
    const { accessToken, phoneNumberId } = getConfig();
    const interactive = {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((btn, i) => ({
          type: "reply",
          reply: {
            id: btn.id || `btn_${i}`,
            title: btn.title.substring(0, 20),
          },
        })),
      },
    };
    if (headerText) interactive.header = { type: "text", text: headerText };
    if (footerText) interactive.footer = { text: footerText };

    return await sendWhatsAppRequest(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone(to),
      type: "interactive",
      interactive,
    });
  } catch (error) {
    console.error("sendButtonMessage error:", error);
    return { success: false, error: error.message };
  }
}

// Send interactive list (max 10 items per section)
export async function sendListMessage(to, bodyText, buttonText, sections, headerText = null, footerText = null) {
  try {
    const { accessToken, phoneNumberId } = getConfig();
    const interactive = {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonText.substring(0, 20),
        sections: sections.map((section) => ({
          title: section.title?.substring(0, 24),
          rows: section.rows.slice(0, 10).map((row) => ({
            id: row.id,
            title: row.title.substring(0, 24),
            description: row.description?.substring(0, 72) || undefined,
          })),
        })),
      },
    };
    if (headerText) interactive.header = { type: "text", text: headerText };
    if (footerText) interactive.footer = { text: footerText };

    return await sendWhatsAppRequest(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone(to),
      type: "interactive",
      interactive,
    });
  } catch (error) {
    console.error("sendListMessage error:", error);
    return { success: false, error: error.message };
  }
}

// Send a template message (for messages outside 24h window)
export async function sendTemplateMessage(to, templateName, languageCode = "en", components = []) {
  try {
    const { accessToken, phoneNumberId } = getConfig();
    return await sendWhatsAppRequest(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone(to),
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components.length > 0 ? components : undefined,
      },
    });
  } catch (error) {
    console.error("sendTemplateMessage error:", error);
    return { success: false, error: error.message };
  }
}

// Mark a message as read
export async function markAsRead(messageId) {
  try {
    const { accessToken, phoneNumberId } = getConfig();
    return await sendWhatsAppRequest(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  } catch (error) {
    console.error("markAsRead error:", error);
    return { success: false, error: error.message };
  }
}
