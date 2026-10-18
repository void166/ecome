export class ConfigError extends Error {}

const isProduction = () => process.env.VERCEL_ENV === 'production';

function integer(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;
}

// Read on every call so the dev server picks up .env edits after a restart and
// serverless functions read the deployment's environment.
export function settings() {
  const provider = process.env.PAYMENT_PROVIDER === 'qpay' ? 'qpay' : 'demo';
  const config = {
    provider,
    isProduction: isProduction(),
    deliveryFeeMnt: integer('DELIVERY_FEE_MNT', 0),
    orderTtlMinutes: integer('ORDER_TTL_MINUTES', 30) || 30,
    publicSiteUrl: (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, ''),
    callbackSecret: process.env.CALLBACK_SECRET || '',
    adminToken: process.env.ADMIN_TOKEN || '',
    qpay: {
      baseUrl: (process.env.QPAY_BASE_URL || 'https://merchant-sandbox.qpay.mn').replace(/\/$/, ''),
      clientId: process.env.QPAY_CLIENT_ID || '',
      clientSecret: process.env.QPAY_CLIENT_SECRET || '',
      invoiceCode: process.env.QPAY_INVOICE_CODE || '',
      receiverCode: process.env.QPAY_RECEIVER_CODE || 'terminal',
    },
  };
  return config;
}

// Throws when checkout must not run: demo payments are never allowed in
// production, and QPay needs merchant credentials and an HTTPS callback.
export function checkoutSettings() {
  const config = settings();
  if (config.provider === 'demo') {
    if (config.isProduction) throw new ConfigError('PAYMENT_PROVIDER=qpay is required in production');
    return config;
  }
  const { clientId, clientSecret, invoiceCode } = config.qpay;
  if (!clientId || !clientSecret || !invoiceCode) throw new ConfigError('QPay merchant credentials are missing');
  if (!config.publicSiteUrl.startsWith('https://') || config.callbackSecret.length < 32) {
    throw new ConfigError('QPay needs an HTTPS PUBLIC_SITE_URL and a CALLBACK_SECRET of 32+ characters');
  }
  return config;
}
