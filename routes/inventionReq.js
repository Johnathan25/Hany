const express = require("express");

const router = express.Router();

const {
  createInventionRequest,

  getMyInventionRequests,
  getMyInventionRequestById,

  getAllInventionRequests,
  getInventionRequestById,

} = require("../controllers/Invention/inventaionReq");

const authMiddleware =
  require("../middlewares/authMiddleware");

const authorizationMiddleware =
  require(`${__dirname}/../middlewares/authorization`);


// ==========================================
// AUTH
// ==========================================

router.use(
  authMiddleware.protected
);


// ==========================================
// CUSTOMER
// ==========================================

// create invention request
router.post(
  "/",
  createInventionRequest
);

// specific invention requests for the customer himself
router.get(
  "/my",
  getMyInventionRequests
);

// specific invention request by id for the customer himself
router.get(
  "/my/:id",
  getMyInventionRequestById
);


// ==========================================
// ADMIN
// ==========================================

router.use(
  authorizationMiddleware.role(
    "superadmin",
    "manager"
  )
);

// all invention requests
router.get(
  "/",
  getAllInventionRequests
);



//  specific invention request by id
router.get(
  "/:id",
  getInventionRequestById
);


module.exports = router;
