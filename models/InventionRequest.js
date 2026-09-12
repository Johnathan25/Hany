const mongoose = require("mongoose");

const inventionRequestSchema = new mongoose.Schema(
  {
    invention: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invention",
      required: true,
    },
    orderNumber:{
       type:String,
       unique:true,
    },

    // customer contact information
    phone:{
      type:String,
      required:true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },


    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    
    pricingOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

   
    pricingOptionName: {
      type: String,
      required: true,
      trim: true,
    },

    acquisitionType: {
      type: String,
      enum: [
        "full_purchase",
        "exclusive_license",
        "license",
        "custom",
      ],
      required: true,
    },

 
    licenseDurationYears: {
      type: Number,
      min: 1,
      default: null,
    },

    
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },



    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "under_review",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      default: "pending_payment",
    },

    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InventionRequest",
  inventionRequestSchema
);