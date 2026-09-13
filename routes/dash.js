const express = require("express");

const router = express.Router();

const dash = require("../controllers/dashboard/dash");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);

router.use(authMiddleware.protected);
router.use(authorizationMiddleware.role('superadmin', 'manager')); 

// Get All + Pagination + Search
router.get(
  "/",
 dash.getDashboard
  
);



module.exports = router;