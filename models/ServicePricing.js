const mongoose = require("mongoose");

const servicePricingSchema = new mongoose.Schema(
  {
    inspectionPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    consultationPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    maintenanceDeposit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },



  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ServicePricing",
  servicePricingSchema
);