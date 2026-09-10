const express = require("express");

const router = express.Router();

const {
  // Service Items
  createItem,
  createManyItems,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,

  // Service Pricing
  createPricing,
  getAllPricing,
  updatePricing,
  getPricingByName
} = require("../controllers/services/service");


const authMiddleware = require(`${__dirname}/../middlewares/authMiddleware`);
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);


// =====================================================
// Service Items Routes
// =====================================================



// Get All Items + Pagination
router.get("/items", getAllItems);

// Get Item By ID
router.get("/items/:id", getItemById);

// Get All Pricing
router.get("/pricing", getAllPricing);

// getPricingByName
router.get("/getPricingByName", getPricingByName);




// protected routes
// router.use(authMiddleware.protected);
// router.use(authorizationMiddleware.role('superadmin', 'manager')); 
// إضافة Item واحد
router.post("/items", createItem);

// إضافة أكثر من Item مرة واحدة
router.post("/items/bulk", createManyItems);

// Update Item
router.put("/items/:id", updateItem);

// Delete Item
router.delete("/items/:id", deleteItem);


// =====================================================
// Service Pricing Routes
// =====================================================

// Create Pricing
router.post("/pricing", createPricing);



// Update Pricing
router.put("/pricing/:id", updatePricing);


module.exports = router;