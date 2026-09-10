
const ServiceRequest =require(`${__dirname}/../../models/ServiceRequest`);
const Payment =require(`${__dirname}/../../models/Payment`)
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
      payableType: "ServiceRequest",
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