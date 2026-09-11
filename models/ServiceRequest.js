const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
   orderNumber:{
       type:String,
       unique:true,
    },
    phone:{
      type:String,
      required:true,
    },


    serviceItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceItem",
      required: true,
    },

    requestType: {
      type: String,
      enum: ["inspection", "consultation", "maintenance"],
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

   
    price: {
      type: Number,
      required: true,
      min: 0,
    },


    status: {
      type: String,
      enum: [
        "unpaid",
        "paid",
        

      ],
      default: "unpaid",
    },
    userName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
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
  "ServiceRequest",
  serviceRequestSchema
);