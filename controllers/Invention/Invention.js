const Invention = require("../../models/Invention");


// CREATE INVENTION

exports.createInvention = async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      description,
      details,
      pricingOptions,
      isActive,
    } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        message: "عنوان براءة الاختراع مطلوب",
      });
    }


// pricingOptions={    name,
//     type}
    // Create
    const invention = await Invention.create({
      title,
      shortDescription,
      description,
      details,
      pricingOptions: pricingOptions || [],
      isActive:
        typeof isActive === "boolean"
          ? isActive
          : true,
    });

    return res.status(201).json({
      message: "تم إنشاء براءة الاختراع بنجاح",
      invention,
    });
  } catch (error) {
    console.error("createInvention error:", error);

    return res.status(500).json({
      message: "خطأ داخلي في الخادم",
      error: error.message,
    });
  }
};


// GET ALL INVENTIONS + PAGINATION + SEARCH

exports.getAllInventions = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      isActive,
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.max(parseInt(limit) || 10, 1);

    const skip = (page - 1) * limit;

    const filter = {};

    // Search
    if (search.trim()) {
      filter.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          details: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // Filter active
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const [inventions, total] = await Promise.all([
      Invention.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Invention.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      message: "تم جلب براءات الاختراع بنجاح",

      data: inventions,

      pagination: {
        currentPage: page,
        limit,
        totalItems: total,
        totalPages,

        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("getAllInventions error:", error);

    return res.status(500).json({
      message: "خطأ داخلي في الخادم",
      error: error.message,
    });
  }
};


// GET INVENTION BY ID

exports.getInventionById = async (req, res) => {
  try {
    const { id } = req.params;

    const invention = await Invention.findById(id);

    if (!invention) {
      return res.status(404).json({
        message: "براءة الاختراع غير موجودة",
      });
    }

    return res.status(200).json({
      message: "تم جلب براءة الاختراع بنجاح",
      invention,
    });
  } catch (error) {
    console.error("getInventionById error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "ID غير صحيح",
      });
    }

    return res.status(500).json({
      message: "خطأ داخلي في الخادم",
      error: error.message,
    });
  }
};


// UPDATE INVENTION

exports.updateInvention = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      shortDescription,
      description,
      details,
      pricingOptions,
      isActive,
    } = req.body;

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (shortDescription !== undefined) {
      updateData.shortDescription = shortDescription;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (details !== undefined) {
      updateData.details = details;
    }

    if (pricingOptions !== undefined) {
      updateData.pricingOptions = pricingOptions;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const invention = await Invention.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!invention) {
      return res.status(404).json({
        message: "براءة الاختراع غير موجودة",
      });
    }

    return res.status(200).json({
      message: "تم تحديث براءة الاختراع بنجاح",
      invention,
    });
  } catch (error) {
    console.error("updateInvention error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "ID غير صحيح",
      });
    }

    return res.status(500).json({
      message: "خطأ داخلي في الخادم",
      error: error.message,
    });
  }
};


// DELETE INVENTION

exports.deleteInvention = async (req, res) => {
  try {
    const { id } = req.params;

    const invention = await Invention.findByIdAndDelete(id);

    if (!invention) {
      return res.status(404).json({
        message: "براءة الاختراع غير موجودة",
      });
    }

    return res.status(200).json({
      message: "تم حذف براءة الاختراع بنجاح",
      invention,
    });
  } catch (error) {
    console.error("deleteInvention error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "ID غير صحيح",
      });
    }

    return res.status(500).json({
      message: "خطأ داخلي في الخادم",
      error: error.message,
    });
  }
};

