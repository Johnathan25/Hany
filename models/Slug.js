const mongoose = require("mongoose");

const slugSchema = new mongoose.Schema(
  {


    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email:{
      type: String,
        required: true,
    }

    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("slug", slugSchema);