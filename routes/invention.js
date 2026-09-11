const express = require("express");

const router = express.Router();

const {
  createInvention,
  getAllInventions,
  getInventionById,
  updateInvention,
  deleteInvention,
  getActiveInventions,
  getActiveInventionById
} = require("../controllers/Invention/Invention");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);

router.use(authMiddleware.protected);

// Get All + Pagination + Search
router.get(
  "/client",
 
  getActiveInventions
);

// Get By ID
router.get(
  "/client/:id",
  getActiveInventionById
);


router.use(authorizationMiddleware.role('superadmin', 'manager')); 


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