const ServiceItem = require(`${__dirname}/../../models/ServiceItem`);
const ServicePricing= require(`${__dirname}/../../models/ServicePricing`);


// =========================
// Create One Item
// =========================
exports.createItem = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "اسم البند مطلوب",
      });
    }

    const item = await ServiceItem.create({
      name,
      description,
    });

    res.status(201).json({
      success: true,
      message: "تم إضافة البند بنجاح",
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "هذا البند موجود بالفعل",
      });
    }

    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};


// =========================
// Create Multiple Items
// =========================
exports.createManyItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "يجب إرسال items كـ array وبداخلها بند واحد على الأقل",
      });
    }

    const createdItems = await ServiceItem.insertMany(items, {
      ordered: false,
    });

    res.status(201).json({
      success: true,
      message: "تم إضافة البنود بنجاح",
      data: createdItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إضافة البنود",
      error: error.message,
    });
  }
};


// =========================
// Get All Items - Pagination
// =========================
exports.getAllItems = async (req, res) => {
  try {

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.max(Number(req.query.limit) || 10, 1);

    const skip = (page - 1) * limit;

    
    const [items, totalItems] = await Promise.all([
      ServiceItem.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      ServiceItem.countDocuments(),
    ]);

    // إجمالي عدد الصفحات
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,

      data: items,

      pagination: {
        currentPage: page,
        limit: limit,
        totalItems: totalItems,
        totalPages: totalPages,

        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};

// =========================
// Get Item By ID
// =========================
exports.getItemById = async (req, res) => {
  try {
    const item = await ServiceItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "البند غير موجود",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};


// =========================
// Update Item
// =========================
exports.updateItem = async (req, res) => {
  try {
    const { name, description } = req.body;

    const item = await ServiceItem.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "البند غير موجود",
      });
    }

    res.status(200).json({
      success: true,
      message: "تم تعديل البند بنجاح",
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "اسم البند موجود بالفعل",
      });
    }

    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};


// =========================
// Delete Item
// =========================
exports.deleteItem = async (req, res) => {
  try {
    const item = await ServiceItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "البند غير موجود",
      });
    }

    res.status(200).json({
      success: true,
      message: "تم حذف البند بنجاح",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};



// =========================
// Create Pricing
// =========================
exports.createPricing = async (req, res) => {
  try {
    const {
      inspectionPrice,
      consultationPrice,
      maintenanceDeposit,
    } = req.body;

    if (
      inspectionPrice === undefined ||
      consultationPrice === undefined ||
      maintenanceDeposit === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "يجب إرسال جميع الأسعار",
      });
    }

    const pricing = await ServicePricing.create({
      inspectionPrice,
      consultationPrice,
      maintenanceDeposit,
    });

    res.status(201).json({
      success: true,
      message: "تم إضافة الأسعار بنجاح",
      data: pricing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};


// =========================
// Get All Pricing
// =========================
exports.getAllPricing = async (req, res) => {
  try {
    const pricing = await ServicePricing.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pricing.length,
      data: pricing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};


// =========================
// Update Pricing
// =========================
exports.updatePricing = async (req, res) => {
  try {
    const {
      inspectionPrice,
      consultationPrice,
      maintenanceDeposit,
    } = req.body;

    const pricing = await ServicePricing.findByIdAndUpdate(
      req.params.id,
      {
        inspectionPrice,
        consultationPrice,
        maintenanceDeposit,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: "بيانات الأسعار غير موجودة",
      });
    }

    res.status(200).json({
      success: true,
      message: "تم تعديل الأسعار بنجاح",
      data: pricing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};


