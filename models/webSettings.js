const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: { type: String, default: "" },
  publicId: { type: String, default: "" },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  variant: { type: String, default: "default" },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  layout: { type: mongoose.Schema.Types.Mixed, default: {} },
  style: { type: mongoose.Schema.Types.Mixed, default: {} },
  animation: { type: mongoose.Schema.Types.Mixed, default: {} },
  elements: { type: mongoose.Schema.Types.Mixed, default: [] },
  responsive: {
    desktop: { type: mongoose.Schema.Types.Mixed, default: {} },
    tablet: { type: mongoose.Schema.Types.Mixed, default: {} },
    mobile: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
}, { _id: false });

const pageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, default: "" },
  pageType: { type: String, default: "custom" },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  sections: [sectionSchema],
}, { _id: false });

const websiteSettingSchema = new mongoose.Schema(
  {
    slugId: { type: mongoose.Schema.Types.ObjectId, ref: "slug", required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    website: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      favicon: imageSchema,
      logo: imageSchema,
      image: imageSchema,
      socialLinks: {
        facebook: { type: String, default: "" },
        twitter: { type: String, default: "" },
        instagram: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        youtube: { type: String, default: "" },
        whatsapp: { type: String, default: "" },
        tiktok: { type: String, default: "" },
      },
    },

    theme: {
      primaryColor: { type: String, default: "#0A2947" },
      secondaryColor: { type: String, default: "#8B5E3C" },
      accentColor: { type: String, default: "#8B5E3C" },
      backgroundColor: { type: String, default: "#ffffff" },
      surfaceColor: { type: String, default: "#ffffff" },
      textPrimaryColor: { type: String, default: "#0A2947" },
      textSecondaryColor: { type: String, default: "#8B5E3C" },
      fontFamily: { type: String, default: "'Cairo', Arial, sans-serif" },
      radius: { type: String, default: "12px" },
      shadow: { type: String, default: "soft" },
      buttonStyle: { type: String, default: "rounded" },
      containerWidth: { type: String, default: "1200px" },
    },

    pages: [pageSchema],

    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WebsiteSetting", websiteSettingSchema);