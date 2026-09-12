const axios = require('axios');

class KashierService {
  constructor() {
    this.apiKey = process.env.KASHIER_API_KEY;
    this.secretKey = process.env.KASHIER_SECRET_KEY;
    this.merchantId = process.env.KASHIER_MERCHANT_ID;
    this.baseUrl = process.env.KASHIER_BASE_URL || 'https://test-api.kashier.io';
    this.baseRedirectUrl = process.env.BASE_URL;
    this.frontendUrl = process.env.FRONTEND_URL;
  }

// Helper to get headers
// to send with each request to Kashier API
  getHeaders() {
    return {
      'Authorization': this.secretKey,
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  
  /**
   * Create a payment session
   */
async createSession(order) {
  try {
    console.log("Creating Kashier Payment Session for order:", order);

    // Support both:
    // order.customer
    // order.order.customer
    const actualOrder = order?.order || order;

    const customer = actualOrder?.customer || {};

    const orderNumber = actualOrder?.orderNumber;
    const amount = Number(actualOrder?.amount || 0);
    const currency = actualOrder?.currency || "EGP";

    console.log("Order Number:", orderNumber);
    console.log("Amount:", amount);
    console.log("Customer:", customer);

    if (!orderNumber) {
      throw new Error("Order number is required");
    }

    if (!amount || amount <= 0) {
      throw new Error("Valid payment amount is required");
    }

    const payload = {
      expireAt: new Date(
        Date.now() + 30 * 60 * 1000
      ).toISOString(),

      maxFailureAttempts: 3,

      paymentType: "credit",

      amount: amount.toFixed(2),

      currency,

      order: orderNumber,

      merchantRedirect:
        `${this.frontendUrl}/payment?order=${encodeURIComponent(orderNumber)}`,

      display: "en",

      type: "one-time",

      allowedMethods: "card",

      customer: {
        email: customer?.email || "",
        name: customer?.name || "",
        phone: customer?.phone || "",
        reference: customer?._id?.toString() || "",
      },

      merchantId: this.merchantId,

      failureRedirect: true,

      defaultMethod: "card",

      description: `Payment for order ${orderNumber}`,

      manualCapture: false,

      serverWebhook:
        `${this.baseRedirectUrl}/api/webhooks/kashier`,

      metaData: {
        orderNumber,

        email: customer?.email || "",

        name: customer?.name || "",

        phone: customer?.phone || "",

        reference: customer?._id?.toString() || "",
      },
    };

    console.log(
      "Kashier Payload:",
      JSON.stringify(payload, null, 2)
    );

    const response = await axios.post(
      `${this.baseUrl}/v3/payment/sessions`,
      payload,
      {
        headers: this.getHeaders(),
      }
    );

    console.log(
      "Kashier Session Response:",
      response.data
    );

    return {
      success: true,
      data: response.data,
    };

  } catch (error) {

    console.error(
      "Kashier Create Session Error:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}


    /**
   * Verify payment status
   */
  async verifyPayment(sessionId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/payment/sessions/${sessionId}/payment`,
        { headers: { 'Authorization': this.secretKey } }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Kashier Verify Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }


    /**
   * Refund a payment
   */
  async refundPayment(transactionId, amount, reason = 'Customer requested refund') {
    try {
      const payload = {
        transactionId,
        amount: amount.toFixed(2),
        reason,
        merchantId: this.merchantId
      };

      const response = await axios.post(
        `${this.baseUrl}/v3/payment/refunds`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Kashier Refund Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

    /**
   * Get exchange rate
   */
  async getExchangeRate(from = 'USD', to = 'EGP') {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/payment/exchange-rate?from=${from}&to=${to}`
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Exchange Rate Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  
  /**
   * Create payment link
   */
  async createPaymentLink(order) {
    try {
      const payload = {
        customer: {
          name: order.customer.name,
          email: order.customer.email
        },
        totalAmount: order.amount,
        currency: order.currency || 'EGP',
        description: `Payment for ${order.orderNumber}`,
        state: 'submitted',
        referenceId: order.orderNumber,
        isManualCapture: false,
        paymentType: 'simple'
      };

      const response = await axios.post(
        `${this.baseUrl}/v2/payment-link`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Create Payment Link Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

    /**
   * Get payment link details
   */
  async getPaymentLink(paymentLinkId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/payment-link/${paymentLinkId}`,
        { headers: { 'Authorization': this.secretKey } }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get Payment Link Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }


}

module.exports =  KashierService;
