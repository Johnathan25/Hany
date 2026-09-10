const express = require("express");

const router = express.Router();

const {
  createComplaint,
  getComplaints,
} = require("../controllers/complaintController");

// create complaint
router.post("/", createComplaint);

// look up complaints by phone number
router.get("/all", getComplaints);

module.exports = router;