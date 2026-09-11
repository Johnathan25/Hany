const express = require("express");

const router = express.Router();

const {
  createInvention,
  getAllInventions,
  getInventionById,
  updateInvention,
  deleteInvention,
} = require("../controllers/Invention/Invention");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);

router.use(authMiddleware.protected);
// Get All + Pagination + Search
router.get(
  "/",
 
  getAllInventions
);

// Get By ID
router.get(
  "/:id",
 
  getInventionById
);

router.use(authorizationMiddleware.role('superadmin', 'manager')); 

// Create
router.post(
  "/",
 
  createInvention
);

// Update
router.put(
  "/:id",
 
  updateInvention
);

// Delete
router.delete(
  "/:id",
 
  deleteInvention
);

module.exports = router;