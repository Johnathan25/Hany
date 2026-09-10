const express = require("express");
const router = express.Router();

const {
  kashierWebhook,
  paymentRedirect,
} = require("../controllers/payment/verification");

// =========================================
// Kashier Webhook
// =========================================

router.post(
  "/kashier",
  kashierWebhook
);

// =========================================
// Payment Redirect
// =========================================

router.get(
  "/redirect",
  paymentRedirect
);

module.exports = router;