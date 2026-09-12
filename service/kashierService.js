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
        // data send to kashier api to create a payment session
      const payload = {
        expireAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        maxFailureAttempts: 3,
        paymentType: 'credit',
        amount: order.amount.toFixed(2),
        currency: order.currency || 'EGP',
        order: order.orderNumber || order.order.orderNumber,
         merchantRedirect:
        `${this.frontendUrl}/payment?order=${order.orderNumber || order.order.orderNumber}}`,
        display: 'en',
        type: 'one-time',
        allowedMethods: 'card,wallet',
        customer: {
          email: order.customer?.email  ||  order.order.customer?.email ,
          name: order.customer?.name || order.order.customer?.name,
          phone: order.customer?.phone || order.order.customer?.phone,
          reference: order.customer?._id || order.order.customer?._id,
        },
        merchantId: this.merchantId,
        failureRedirect: true,
        defaultMethod: 'card',
        description: `Payment for order ${order.orderNumber || order.order.orderNumber}`,
        manualCapture: false,
        serverWebhook: `${this.baseRedirectUrl}/api/webhooks/kashier`,
        metaData: {
          orderNumber: order.orderNumber || order.order.orderNumber,
          customerName: order.customer?.name || order.order.customer?.name,
          customerEmail: order.customer?.email || order.order.customer?.email,
          customerPhone: order.customer?.phone || order.order.customer?.phone,
          customerId: order.customer?._id || order.order.customer?._id,
        }
      };



      const response = await axios.post(
        `${this.baseUrl}/v3/payment/sessions`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Kashier Create Session Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
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
