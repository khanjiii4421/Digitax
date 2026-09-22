/**
 * Payment Provider Abstraction Layer for DigiTax
 */

export class PaymentProvider {
  constructor(config = {}) {
    this.config = config;
  }

  async createPayment(params) {
    throw new Error('createPayment not implemented in base class');
  }

  async verifyPayment(params) {
    throw new Error('verifyPayment not implemented in base class');
  }
}

export class ManualPaymentProvider extends PaymentProvider {
  async createPayment({ applicationId, amount, proofUrl, method, reference }) {
    return {
      success: true,
      provider: 'manual',
      status: 'pending_verification',
      amount,
      proofUrl,
      method,
      reference,
      requiresAdminApproval: true
    };
  }

  async verifyPayment({ transactionId, adminNotes, approved }) {
    return {
      success: true,
      status: approved ? 'verified' : 'rejected',
      adminNotes
    };
  }
}

export class EasypaisaPaymentProvider extends PaymentProvider {
  async createPayment({ applicationId, amount, orderRef, customerEmail, customerPhone }) {
    // When merchant credentials are provided, construct checkout payload
    const merchantId = process.env.EASYPAISA_MERCHANT_ID || this.config.merchantId;
    if (!merchantId) {
      return {
        success: false,
        error: 'Easypaisa merchant credentials not configured. Please use manual payment.'
      };
    }

    return {
      success: true,
      provider: 'easypaisa',
      status: 'pending_gateway',
      checkoutUrl: `https://easypay.easypaisa.com.pk/easypay/Index.jsf`,
      orderRef
    };
  }

  async verifyPayment({ paymentToken, orderRef }) {
    // Verify callback with Easypaisa server API
    return {
      success: false,
      error: 'Easypaisa IPN verification requires merchant key'
    };
  }
}

export function getPaymentProvider(providerName = 'manual', config = {}) {
  switch (providerName.toLowerCase()) {
    case 'easypaisa':
      return new EasypaisaPaymentProvider(config);
    case 'manual':
    default:
      return new ManualPaymentProvider(config);
  }
}
