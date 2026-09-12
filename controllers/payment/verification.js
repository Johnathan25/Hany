
const ServiceRequest =require(`${__dirname}/../../models/ServiceRequest`);
const Payment =require(`${__dirname}/../../models/Payment`)
const kashierService1 = require("../../service/kashierService");


const kashierService = new kashierService1();
exports.kashierWebhook = async (req, res) => {
  try {

    const data = req.body.data;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Webhook data is missing",
      });
    }

    const {
      merchantOrderId,
      kashierOrderId,
      transactionId,
      status,
      amount,
      currency,
    } = data;



    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        message: "Merchant Order ID is required",
      });
    }

    // Kashier SUCCESS
    if (status !== "SUCCESS") {
      return res.status(200).json({
        success: true,
        message: "Payment is not successful",
        status,
      });
    }

    // البحث عن Payment عن طريق orderNumber
    const payment = await Payment.findOne({
      reference: merchantOrderId,
      
    });

    if (!payment) {
      console.log(
        "PAYMENT NOT FOUND:",
        merchantOrderId
      );

      return res.status(404).json({
        success: false,
        message: "Payment not found",
        merchantOrderId,
      });
    }

    // منع تكرار الـ webhook
    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
      });
    }

    // تحديث Payment
    payment.status = "paid";

    payment.transactionId = transactionId;

    payment.gatewayResponse = req.body;

    payment.paidAt = new Date();

    await payment.save();

    // تحديث ServiceRequest
    if (payment.payableType === "ServiceRequest") {
      await ServiceRequest.findByIdAndUpdate(
        payment.payableId,
        {
          status: "paid",
        }
      );
    }else if (payment.payableType === "InventionRequest") {
      const InventionRequest = require("../../models/InventionRequest");
      await InventionRequest.findByIdAndUpdate(
        payment.payableId,
        { 
          status: "paid",
        }
      );
    }








    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
    });

  } catch (error) {

    console.error(
      "Kashier Webhook Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

exports.paymentRedirect = async (req, res) => {
  try {



    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/result`
    );

  } catch (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed`
    );
  }
};


exports.createAdminPayment = async (req, res) => {
  try {
    const {
      customer,
      payableType,
      payableId,
      amount,
      paymentType,
      description,
      name,
      email,
      phone,
    } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------

    if (
      !["ServiceRequest", "InventionRequest", "other"].includes(
        payableType
      )
    ) {
      return res.status(400).json({
        message: "نوع الفاتورة غير صحيح",
      });
    }

    if (payableType !== "other" && !payableId) {
      return res.status(400).json({
        message: "payableId مطلوب",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "المبلغ يجب أن يكون أكبر من صفر",
      });
    }

    if (!["full", "deposit"].includes(paymentType)) {
      return res.status(400).json({
        message: "نوع الدفع غير صحيح",
      });
    }

    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "بيانات العميل مطلوبة",
      });
    }

    // -----------------------------
    // Get customer
    // -----------------------------

    // لو عندك customer ID وعايز تربطه بالـ Payment
    // هنعمله هنا.
    //
    // حاليًا لو الدفع ممكن يكون لشخص غير مسجل:
    const customerId = customer || null;

    // -----------------------------
    // Generate invoice number
    // -----------------------------

    const invoiceNumber = `INV-${Date.now()}`;

    // -----------------------------
    // Create Payment
    // -----------------------------

    const payment = await Payment.create({
      invoiceNumber,

      customer: customerId,

      name: name.trim(),

      email: email.trim(),

      phone: phone.trim(),

      payableType,

      payableId:
        payableType === "other"
          ? undefined
          : payableId,

      amount: Number(amount),

      currency: "EGP",

      paymentType,

      description,

      status: "pending",

      provider: "kashier",
    });

    // -----------------------------
    // Create Kashier Session
    // -----------------------------

    const kashierResult =
      await kashierService.createSession({
        amount: payment.amount,

        currency: payment.currency,

        orderNumber: payment.invoiceNumber,

        customer: {
          _id: payment.customer,

          name: payment.name,

          email: payment.email,

          phone: payment.phone,
        },
      });

    // -----------------------------
    // Kashier Error
    // -----------------------------

    if (!kashierResult.success) {
      await Payment.findByIdAndUpdate(
        payment._id,
        {
          status: "failed",

          gatewayResponse:
            kashierResult.error,
        }
      );

      return res.status(400).json({
        message: "فشل إنشاء رابط الدفع",

        error: kashierResult.error,
      });
    }

    // -----------------------------
    // Extract Kashier Response
    // -----------------------------

    const gatewayData =
      kashierResult.data;

    const paymentUrl =
      gatewayData.paymentUrl ||
      gatewayData.url ||
      gatewayData.redirectUrl ||
      gatewayData.checkoutUrl;

    if (!paymentUrl) {
      await Payment.findByIdAndUpdate(
        payment._id,
        {
          status: "failed",

          gatewayResponse: gatewayData,
        }
      );

      return res.status(400).json({
        message:
          "تم إنشاء جلسة الدفع ولكن لم يتم الحصول على رابط الدفع",
      });
    }

    // -----------------------------
    // Update Payment
    // -----------------------------

    payment.sessionId =
      gatewayData.sessionId ||
      gatewayData.id;

    payment.paymentLinkId =
      gatewayData.paymentLinkId ||
      gatewayData.paymentLink?.id;

    payment.paymentUrl =
      paymentUrl;

    payment.gatewayResponse =
      gatewayData;

    await payment.save();

    // -----------------------------
    // Response
    // -----------------------------

    return res.status(201).json({
      success: true,

      message:
        "تم إنشاء الفاتورة ورابط الدفع بنجاح",

      data: {
        paymentId: payment._id,

        invoiceNumber:
          payment.invoiceNumber,

        amount:
          payment.amount,

        currency:
          payment.currency,

        paymentType:
          payment.paymentType,

        payableType:
          payment.payableType,

        payableId:
          payment.payableId,

        status:
          payment.status,

        paymentUrl:
          payment.paymentUrl,
      },
    });

  } catch (error) {
    console.error(
      "Create Admin Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "حدث خطأ داخلي في الخادم",

      error: error.message,
    });
  }
};
