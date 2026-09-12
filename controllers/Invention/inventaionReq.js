const mongoose = require("mongoose");
const Invention = require("../../models/Invention");
const InventionRequest = require("../../models/InventionRequest");
const KashierService = require("../../service/kashierService");
const paymentModel = require("../../models/Payment");
const kashierService = new KashierService();


// ==========================================
// CREATE INVENTION REQUEST + DEPOSIT PAYMENT
// ==========================================
exports.createInventionRequest = async (req, res) => {
  try {
    const userId = req.user.userId;

    
    const {
      inventionId,
      pricingOptionId,
      customerName,
      phone,
      address,
      email,
    } = req.body;


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!inventionId) {
      return res.status(400).json({
        message: "براءة الاختراع مطلوبة",
      });
    }

    if (!pricingOptionId) {
      return res.status(400).json({
        message: "يجب اختيار نوع الترخيص",
      });
    }

    if (!customerName || !phone || !address || !email) {
      return res.status(400).json({
        message: "جميع البيانات الشخصية مطلوبة",
      });
    }


    // ==========================================
    // GET INVENTION
    // ==========================================

    const invention = await Invention.findOne({
      _id: inventionId,
      isActive: true,
    });

    if (!invention) {
      return res.status(404).json({
        message: "براءة الاختراع غير موجودة أو غير متاحة",
      });
    }


    // ==========================================
    // GET PRICING OPTION
    // ==========================================

    const pricingOption = invention.pricingOptions.id(
      pricingOptionId
    );

    if (!pricingOption) {
      return res.status(404).json({
        message: "خيار الترخيص غير موجود",
      });
    }


    // ==========================================
    // CHECK PRICING OPTION ACTIVE
    // ==========================================

    if (!pricingOption.isActive) {
      return res.status(400).json({
        message: "خيار الترخيص غير متاح حاليًا",
      });
    }


    // ==========================================
    // GENERATE ORDER NUMBER
    // ==========================================

    const orderNumber =
      `INV-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;


    // ==========================================
    // CREATE REQUEST
    // ==========================================

    const existemail=email
    const inventionRequest =
      await InventionRequest.create({
        invention: invention._id,

        orderNumber,

        customer: userId,

        customerName,
        phone,
        address,
        email,

        pricingOptionId: pricingOption._id,

 
        pricingOptionName: pricingOption.type,

        acquisitionType: pricingOption.type,

        licenseDurationYears:
          pricingOption.durationYears,

        // السعر الأصلي
        finalPrice: pricingOption.price,

        // العربون الذي سيدفعه العميل
        depositAmount: pricingOption.depositAmount,

        status: "pending_payment",
      });


    // ==========================================
    // CREATE KASHIER PAYMENT SESSION
    // ==========================================

    const paymentResult =
      await kashierService.createSession({
        amount: pricingOption.depositAmount,

        currency: "EGP",

        order: {
          orderNumber,

          customer: {
            _id: userId,
            name: customerName,
             email: existemail  ,
            phone,
          },
        },
      });

      await paymentModel.create({
        customer: userId,
        name: customerName,
        email: existemail,
        phone,
        payableType: "InventionRequest",
        payableId: inventionRequest._id,    
        amount: pricingOption.depositAmount,
        currency: "EGP",
        paymentType: "deposit",
        status: "pending",
        provider: "kashier",
         reference: orderNumber,
      });


    // ==========================================
    // KASHIER ERROR
    // ==========================================

    if (!paymentResult.success) {

      await InventionRequest.findByIdAndUpdate(
        inventionRequest._id,
        {
          status: "cancelled",
          adminNotes:
            "فشل إنشاء جلسة الدفع",
        }
      );

      return res.status(500).json({
        message: "فشل إنشاء عملية الدفع",
        error: paymentResult.error,
      });
    }


    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      message:
        "تم إنشاء طلب براءة الاختراع، يرجى دفع العربون",

      request: inventionRequest,

      payment: {
        amount: pricingOption.depositAmount,

        currency: "EGP",

        kashier: paymentResult.data,
      },
    });

  } catch (error) {

    console.error(
      "createInventionRequest error:",
      error
    );

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


// ==========================================
// GET CUSTOMER REQUESTS 
// ==========================================

exports.getMyInventionRequests = async (req, res) => {
  try {

    const userId = req.user.userId;

    let {
      page = 1,
      limit = 10,
      status,
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.max(parseInt(limit) || 10, 1);

    const skip = (page - 1) * limit;

    const filter = {
      customer: userId,
    };

    if (status) {
      filter.status = status;
    }

    const [requests, total] =
      await Promise.all([

        InventionRequest.find(filter)
          .populate(
            "invention",
            "title shortDescription"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        InventionRequest.countDocuments(filter),

      ]);

    const totalPages =
      Math.ceil(total / limit);

    return res.status(200).json({

      message:
        "تم جلب طلباتك بنجاح",

      data: requests,

      pagination: {
        currentPage: page,
        limit,
        totalItems: total,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },

    });

  } catch (error) {

    console.error(
      "getMyInventionRequests error:",
      error
    );

    return res.status(500).json({
      message: "خطأ داخلي في الخادم",
      error: error.message,
    });
  }
};




// ==========================================
// GET CUSTOMER REQUEST BY ID
// ==========================================

exports.getMyInventionRequestById = async (req, res) => {
  try {

    const userId = req.user.userId;
    const { id } = req.params;

    const request =
      await InventionRequest.findOne({
        _id: id,
        customer: userId,
      })
        .populate(
          "invention",
          "title shortDescription description details"
        )
        .lean();

    if (!request) {
      return res.status(404).json({
        message: "الطلب غير موجود",
      });
    }

    return res.status(200).json({
      message: "تم جلب الطلب بنجاح",
      request,
    });

  } catch (error) {

    console.error(
      "getMyInventionRequestById error:",
      error
    );

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


// ==========================================
// ADMIN GET ALL REQUESTS
// ==========================================

exports.getAllInventionRequests = async (req, res) => {
  try {

    let {
      page = 1,
      limit = 10,
      status,
      search = "",
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.max(parseInt(limit) || 10, 1);

    const skip = (page - 1) * limit;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search.trim()) {

      filter.$or = [
        {
          orderNumber: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];

    }

    const [requests, total] =
      await Promise.all([

        InventionRequest.find(filter)
          .populate(
            "invention",
            "title"
          )
          .populate(
            "customer",
            "username email phone"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        InventionRequest.countDocuments(filter),

      ]);

    const totalPages =
      Math.ceil(total / limit);

    return res.status(200).json({

      message:
        "تم جلب طلبات براءات الاختراع بنجاح",

      data: requests,

      pagination: {
        currentPage: page,
        limit,
        totalItems: total,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },

    });

  } catch (error) {

    console.error(
      "getAllInventionRequests error:",
      error
    );

    return res.status(500).json({
      message: "خطأ داخلي في الخادم",
      error: error.message,
    });
  }
};



// ==========================================
// ADMIN GET REQUEST BY ID
// ==========================================

exports.getInventionRequestById = async (req, res) => {
  try {

    const { id } = req.params;

    const request =
      await InventionRequest.findById(id)
        .populate(
          "invention",
          "title shortDescription description details pricingOptions"
        )
        .populate(
          "customer",
          "username email phone"
        );

    if (!request) {
      return res.status(404).json({
        message: "الطلب غير موجود",
      });
    }

    return res.status(200).json({
      message: "تم جلب الطلب بنجاح",
      request,
    });

  } catch (error) {

    console.error(
      "getInventionRequestById error:",
      error
    );

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