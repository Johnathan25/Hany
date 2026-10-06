const express = require(`express`);
const multer = require("multer");
const router=express.Router();
const authMiddleware = require(`${__dirname}/../../middlewares/authMiddleware`);
const authorizationMiddleware = require(`${__dirname}/../../middlewares/authorization`);
const website = require(`${__dirname}/../../controllers/websiteSettings/website`);





// Multer memory storage (for direct Cloudinary streaming)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

// Public
router.get("/:slug", website.getBySlug);


// Protected
router.use(authMiddleware.protected);
router.use(authorizationMiddleware.role("customer"));
router.put("/:slug", upload.none(), website.update);
router.post("/:slug/upload", upload.single("file"), website.uploadImage);
router.delete("/:slug/upload", website.deleteImage);
module.exports=router;