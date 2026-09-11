const mongoose = require("mongoose");

const pricingOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "full_purchase",
        "exclusive_license",
        "license",
        "custom",
      ],
      default: "custom",
    },

    // مدة الترخيص
    // null = شراء كامل أو بدون مدة محددة
    durationYears: {
      type: Number,
      min: 1,
      default: null,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // depositAmount: {
    //   type: Number,
    //   required: true,
    //   min: 0,
    // },



    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const inventionSchema = new mongoose.Schema(
  {

    title: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
    },

   
    description: {
      type: String,
      trim: true,
    },

    
    details: {
      type: String,
      trim: true,
    },

  
    pricingOptions: {
      type: [pricingOptionSchema],
      default: [],
    },

    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invention", inventionSchema);
