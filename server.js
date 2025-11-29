// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER;

// ✅ Your emergency contacts (E.164 format, NO SPACES)
const emergencyContacts = [
  "+917013512446",
  "+919441652345",
  "+919440719096",
  "+918125316746",
];

let client = null;

if (!accountSid || !authToken || !TWILIO_NUMBER) {
  console.warn(
    "⚠️ Missing Twilio env vars. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER."
  );
} else {
  client = twilio(accountSid, authToken);
  console.log("✅ Twilio client initialized");
}

// Health check
app.get("/", (req, res) => {
  res.send("SafeFallAI backend is running ✅");
});

// 🚨 Alert endpoint
app.post("/send-alert", async (req, res) => {
  const { latitude, longitude } = req.body || {};
  console.log("📥 /send-alert body:", req.body);

  // Check Twilio config first
  if (!client || !TWILIO_NUMBER) {
    console.error("❌ Twilio not configured");
    return res.status(500).json({
      success: false,
      message:
        "Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER.",
    });
  }

  // Build location link (optional)
  let googleLink = "Location unavailable";
  if (typeof latitude === "number" && typeof longitude === "number") {
    googleLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  const body = `🚨 EMERGENCY ALERT 🚨
Deepu needs help immediately!

📍 Location: ${googleLink}`;

  try {
    const results = [];

    for (const contactNumber of emergencyContacts) {
      console.log("📤 Sending SMS to:", contactNumber);

      const msg = await client.messages.create({
        from: TWILIO_NUMBER,
        to: contactNumber,
        body,
      });

      results.push({ to: contactNumber, sid: msg.sid });
    }

    console.log("✅ SMS alerts sent:", results);

    res.json({ success: true, message: "Alerts sent!", results });
  } catch (error) {
    console.error("❌ Twilio error:", error);
    res.status(500).json({
      success: false,
      message: "SMS failed",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
