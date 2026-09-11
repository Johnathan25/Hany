const ServiceRequest = require("../../models/ServiceRequest");
const ServiceItem = require("../../models/ServiceItem");
const ServicePricing = require("../../models/ServicePricing");
const Payment = require("../../models/Payment");
const mongoose = require("mongoose");

const KashierService = require("../../service/kashierService");

// to KashierService is a class
const kashier = new KashierService();


// create service request
exports.createServiceRequest = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const customerId = req.user.userId;

    const {
      serviceItem,
      requestType,
      description,
      phone,
      address,
      userName,
      
    } = req.body;

    // =========================================
    // 1. Validate request data
    // =========================================

    if (!serviceItem || !requestType) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "الخدمة والبند مطلوبان",
      });
    }

    // =========================================
    // 2. Check Service Item
    // =========================================

    const item = await ServiceItem.findById(serviceItem).session(session);

    if (!item) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "البند غير موجود",
      });
    }

    // =========================================
    // 3. Get Pricing
    // =========================================

    const pricing = await ServicePricing.findOne()
      .sort({ createdAt: -1 })
      .session(session);

    if (!pricing) {
      await session.abortTransaction();

      return res.status(500).json({
        success: false,
        message: "أسعار الخدمات غير موجودة",
      });
    }

    // =========================================
    // 4. Determine price
    // =========================================

    let price;

    switch (requestType) {
      case "inspection":
        price = pricing.inspectionPrice;
        break;

      case "consultation":
        price = pricing.consultationPrice;
        break;

      case "maintenance":
        price = pricing.maintenanceDeposit;
        break;

      default:
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "نوع الخدمة غير صحيح",
        });
    }

    // =========================================
    // 5. Generate order number
    // =========================================

    const orderNumber =
      `SR-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // =========================================
    // 6. Create Service Request
    // =========================================

    const [serviceRequest] = await ServiceRequest.create(
      [
        {
          customer: customerId,
          orderNumber,
          serviceItem: item._id,
          requestType,
          description,
          price,
          phone,
          currency: "EGP",
          status: "unpaid",
            address,
            userName,
        },
      ],
      { session }
    );

    // =========================================
    // 7. Create Payment
    // =========================================

    const [payment] = await Payment.create(
      [
        {
          customer: customerId,
          payableType: "ServiceRequest",
          payableId: serviceRequest._id,
          amount: price,
          currency: "EGP",
          paymentType: "full",
          status: "pending",
          provider: "kashier",
          reference: orderNumber,
        },
      ],
      { session }
    );

    // =========================================
    // 8. Prepare Kashier Order
    // =========================================

    const order = {
      amount: price,
      currency: "EGP",
      orderNumber,

      customer: {
        _id: customerId,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
    };

    // =========================================
    // 9. Create Kashier Session
    // =========================================

    const kashierResponse = await kashier.createSession(order);

    if (!kashierResponse.success) {
      // ❌ Kashier فشل
      // كل اللي اتعمل في MongoDB هيتلغي

      await session.abortTransaction();

      return res.status(502).json({
        success: false,
        message: "فشل إنشاء عملية الدفع",
        error: kashierResponse.error,
      });
    }

    // =========================================
    // 10. Get Kashier Session Data
    // =========================================

const sessionData = kashierResponse.data;

const sessionId =
  sessionData.sessionId ||
  sessionData.id ||
  sessionData._id;

const paymentUrl =
  sessionData.paymentUrl ||
  sessionData.url ||
  sessionData.redirectUrl ||
  sessionData.sessionUrl;

    // =========================================
    // 11. Validate Kashier response
    // =========================================


    if (!sessionId || !paymentUrl) {
      await session.abortTransaction();

      return res.status(502).json({
        success: false,
        message: "استجابة الدفع غير صالحة",
      });
    }

    // =========================================
    // 12. Update Payment
    // =========================================

    payment.sessionId = sessionId;
    payment.gatewayResponse = sessionData;
    payment.status = "processing";

    await payment.save({ session });

    // =========================================
    // 13. Commit Transaction
    // =========================================

    await session.commitTransaction();

    // =========================================
    // 14. Return Payment URL
    // =========================================

    return res.status(201).json({
      success: true,
      message: "تم إنشاء طلب الخدمة، برجاء إتمام الدفع",

      data: {
        serviceRequestId: serviceRequest._id,
        orderNumber: serviceRequest.orderNumber,

        amount: price,
        currency: "EGP",

        paymentId: payment._id,

        paymentUrl,
      },
    });

  } catch (error) {
    // =========================================
    // Rollback
    // =========================================

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Create Service Request Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });

  } finally {
    await session.endSession();
  }
};

// delete service request
exports.deleteServiceRequest = async (req, res) => {
  try {

    const serviceRequest =
      await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "طلب الخدمة غير موجود",
      });
    }

    // =================================
    // Find payment
    // =================================

    const payment = await Payment.findOne({
      payableType: "ServiceRequest",
      payableId: serviceRequest._id,
    });

    // =================================
    // Don't allow delete if paid
    // =================================

    if (payment && payment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن حذف الطلب بعد إتمام الدفع",
      });
    }

    // =================================
    // Delete payment
    // =================================

    if (payment) {
      await Payment.findByIdAndDelete(payment._id);
    }

    // =================================
    // Delete request
    // =================================

    await ServiceRequest.findByIdAndDelete(
      serviceRequest._id
    );

    return res.status(200).json({
      success: true,
      message: "تم حذف طلب الخدمة بنجاح",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};


// Get All Service Requests for Admin
exports.getAllServiceRequests = async (req, res) => {
  try {

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const [requests, totalItems] =
      await Promise.all([

        ServiceRequest.find()
          .populate(
            "customer",
            "userName phone email address"
          )
          .populate(
            "serviceItem",
            "name description"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        ServiceRequest.countDocuments(),

      ]);

    const totalPages =
      Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,

      data: requests,

      pagination: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};


// Get All Requests for Customer
exports.getCustomerServiceRequests = async (req, res) => {
  try {

    const customerId = req.user.userId;

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const filter = {
      customer: customerId,
    };

    const [requests, totalItems] =
      await Promise.all([

        ServiceRequest.find(filter)
          .populate(
            "serviceItem",
            "name description"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        ServiceRequest.countDocuments(filter),

      ]);

    const totalPages =
      Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,

      data: requests,

      pagination: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};



// Get Payment Status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: "رقم الطلب مطلوب",
      });
    }

    const payment = await Payment.findOne({
      reference: orderNumber,
    })
      .select(
        "status amount currency paymentType transactionId paidAt reference payableId"
      )
      .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "عملية الدفع غير موجودة",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderNumber: payment.reference,
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentType: payment.paymentType,
        transactionId: payment.transactionId || null,
        paidAt: payment.paidAt || null,
      },
    });

  } catch (error) {
    console.error("Get Payment Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
