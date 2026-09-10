const express = require("express");

const router = express.Router();

const {
  createServiceRequest,
  deleteServiceRequest,
  getAllServiceRequests,
  getCustomerServiceRequests,
} = require("../controllers/services/serviceRequest");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizationMiddleware = require("../middlewares/authorization");

// =====================================================
// Customer Routes
// =====================================================

// Create Service Request
router.post(
  "/",
  authMiddleware.protected,
  createServiceRequest
);

// Get My Service Requests
router.get(
  "/my-requests",
  authMiddleware.protected,
  getCustomerServiceRequests
);

// Delete My Service Request
router.delete(
  "/:id",
  authMiddleware.protected,
  deleteServiceRequest
);


// =====================================================
// Admin Routes
// =====================================================

// Get All Service Requests
router.get(
  "/admin/all",
  authMiddleware.protected,
  authorizationMiddleware.role("superadmin", "manager"),
  getAllServiceRequests
);

module.exports = router;