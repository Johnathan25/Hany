const express = require("express");
const router = express.Router();

const {
  kashierWebhook,
  paymentRedirect,
  createAdminPayment,
  getInvoiceTypePayments
} = require("../controllers/payment/verification");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);

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





router.use(authMiddleware.protected);
router.use(authorizationMiddleware.role('superadmin', 'manager')); 
router.post(
  "/paymentLink",
  createAdminPayment
);

router.get(
  "/invoiceTypePayments",
  getInvoiceTypePayments
);





module.exports = router;