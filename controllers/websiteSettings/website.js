const WebsiteSetting = require("../../models/webSettings");
const Slug = require("../../models/Slug");
const { redisClient } = require("../../config/redis");
const cloudinary = require("../../config/cloudinaryConfig");
const webSettings = require("../../models/webSettings");

const CACHE_TTL = 60 * 60 * 24 * 365;


// GET BY SLUG

exports.getBySlug = async (req, res) => {
  try {
    const hostname = req.hostname;
    let slug = hostname.split(".")[0].trim();
    const DOMAIN_NAME = process.env.DOMAIN_NAME || "localhost";

    if (hostname === DOMAIN_NAME || hostname === `www.${DOMAIN_NAME}`) {
      slug = req.params.slug;
    }
    if (!slug) return res.status(400).json({ message: "لم يتم العثور على المتجر" });

    const cacheKey = `website:settings:${slug}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json({ source: "redis", data: JSON.parse(cached) });

    const store = await Slug.findOne({ slug });
    if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

    let settings = await WebsiteSetting.findOne({ slugId: store._id }).lean();
   if (!settings) {
  settings = await WebsiteSetting.create({
    slugId: store._id,
    userId: store.userId,
    website: { title: "", description: "" },
    theme: {
      primaryColor: "#0A2947",
      secondaryColor: "#8B5E3C",
      backgroundColor: "#ffffff",
      surfaceColor: "#ffffff",
      textPrimaryColor: "#0A2947",
      textSecondaryColor: "#8B5E3C",
      fontFamily: "'Cairo', Arial, sans-serif",
      radius: "12px",
      shadow: "soft",
    },
    pages: [],
    status: "draft",
  });
}

    await redisClient.set(cacheKey, JSON.stringify(settings), "EX", CACHE_TTL);
    return res.json({ source: "mongodb", data: settings });
  } catch (error) {
    console.error("getBySlug error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// UPLOAD SINGLE IMAGE (new endpoint)

const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });

exports.uploadImage = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;

    const store = await Slug.findOne({ slug, userId });
    if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

    if (!req.file) return res.status(400).json({ message: "لم يتم اختيار ملف" });

    const context = req.body.context || "section";
    const folder = `stores/${slug}/website/${context}`;

    const result = await uploadToCloudinary(req.file, folder);

    return res.json({
      data: { url: result.secure_url, publicId: result.public_id },
    });
  } catch (error) {
    console.error("uploadImage error:", error);
    return res.status(500).json({ message: "فشل رفع الصورة" });
  }
};


// DELETE IMAGE

exports.deleteImage = async (req, res) => {
  try {
    const { slug } = req.params;
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ message: "publicId مطلوب" });

    const userId = req.user._id;
    const store = await Slug.findOne({ slug, userId });
    if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

    await cloudinary.uploader.destroy(publicId);
    return res.json({ message: "تم الحذف" });
  } catch (error) {
    console.error("deleteImage error:", error);
    return res.status(500).json({ message: "فشل الحذف" });
  }
};


// UPDATE SETTINGS

exports.update = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;

    const store = await Slug.findOne({ slug, userId });
    if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

    const existing = await WebsiteSetting.findOne({ slugId: store._id, userId }).lean();

    let body = { ...req.body };
    ["website", "theme", "pages"].forEach((key) => {
      if (typeof body[key] === "string") {
        try { body[key] = JSON.parse(body[key]); }
        catch (e) { console.warn(`Failed to parse ${key}:`, e.message); }
      }
    });

    const updateData = {
      ...body,
      slugId: store._id,
      userId,
    };

    
    const settings = await WebsiteSetting.findOneAndUpdate(
      { slugId: store._id, userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await redisClient.del(`website:settings:${slug}`);

    return res.json({ message: "تم التحديث بنجاح", data: settings });
  } catch (error) {
    console.error("update error:", error);
    return res.status(500).json({ message: "فشل التحديث", error: error.message });
  }
};