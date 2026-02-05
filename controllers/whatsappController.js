const twilio = require("twilio");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+91${to}`,

      body: message,
    });
    console.log("✅ WhatsApp message sent:", response.sid);
  } catch (error) {
    console.error("❌ Failed to send WhatsApp message:", error.message);
  }
};

module.exports = { sendWhatsAppMessage };
