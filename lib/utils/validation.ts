import { z } from 'zod';
import type { TiendaNubeOrder } from '@/types/api';

const paymentSchema = z.object({
  id: z.number(),
  status: z
    .enum(['pending', 'authorized', 'paid', 'voided', 'refunded', 'abandoned'])
    .optional(),
  payment_method: z.string(),
  payment_type: z.string().nullable().optional(),
  gateway: z.string(),
  installments: z.number().nullable().optional(),
  installment_amount: z.string().nullable().optional(),
  gateway_fee: z.string().nullable().optional(),
  installments_cost: z.string().nullable().optional(),
  net_amount: z.string().nullable().optional(),
  total: z.string().nullable().optional(),
  transaction_amount: z.string().nullable().optional(),
  authorization_code: z.string().nullable().optional(),
  external_reference: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

const productSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  variant_id: z.number().nullable().optional(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  quantity: z.number(),
  price: z.string(),
  cost: z.string().nullable().optional(),
}).passthrough();

export const tiendaNubeOrderSchema = z.object({
  id: z.number(),
  number: z.number(),
  token: z.string().optional(),
  store_id: z.union([z.string(), z.number()]), // API returns number, convert to string later
  created_at: z.string(),
  updated_at: z.string(),
  status: z.string().optional(),
  payment_status: z.string().optional(),
  currency: z.string().optional(),
  total: z.string().optional(),
  subtotal: z.string().optional(),
  total_usd: z.string().optional(),
  discount: z.string().nullable().optional(),
  discount_coupon: z.string().nullable().optional(),
  discount_gateway: z.string().nullable().optional(),
  shipping: z.string().optional(),
  shipping_option: z.string().optional(),
  shipping_cost_customer: z.string().optional(),
  shipping_cost_owner: z.string().optional(),
  shipping_cost_store: z.string().optional(),
  gateway: z.string(),
  gateway_name: z.string().optional(),
  customer: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().nullable().optional(),
  }),
  products: z.array(productSchema).optional(),
  payments: z.array(paymentSchema).optional(),
  extra: z.record(z.string(), z.any()).optional(),
}).passthrough();

type OrderSafeParse =
  | { success: true; data: TiendaNubeOrder }
  | { success: false; error: z.ZodError };

function normalizeOrder(parsed: any): TiendaNubeOrder {
  const allowedStatuses = new Set(['open', 'closed', 'cancelled']);
  const allowedPaymentStatuses = new Set([
    'pending',
    'authorized',
    'paid',
    'voided',
    'refunded',
    'abandoned',
  ]);

  const rawStatus = typeof parsed.status === 'string' ? parsed.status.toLowerCase() : 'open';
  const rawPaymentStatus = typeof parsed.payment_status === 'string' ? parsed.payment_status.toLowerCase() : 'pending';

  const normalizedStatus = allowedStatuses.has(rawStatus)
    ? (rawStatus as TiendaNubeOrder['status'])
    : 'open';
  const normalizedPaymentStatus = allowedPaymentStatuses.has(rawPaymentStatus)
    ? (rawPaymentStatus as TiendaNubeOrder['payment_status'])
    : 'pending';

  const payments = parsed.payments
    ? parsed.payments.map((payment: any) => ({
        ...payment,
        status: payment.status ?? 'pending',
      }))
    : undefined;

  const products = Array.isArray(parsed.products) ? parsed.products : [];

  return {
    ...parsed,
    status: normalizedStatus,
    payment_status: normalizedPaymentStatus,
    token: parsed.token ?? '',
    store_id:
      typeof parsed.store_id === 'number'
        ? parsed.store_id.toString()
        : String(parsed.store_id),
    total: parsed.total ?? '0',
    subtotal: parsed.subtotal ?? parsed.total ?? '0',
    total_usd: parsed.total_usd ?? parsed.total ?? '0',
    discount: parsed.discount ?? '0',
    shipping: parsed.shipping ?? '0',
    shipping_option: parsed.shipping_option ?? '',
    gateway_name: parsed.gateway_name ?? parsed.gateway,
    currency: parsed.currency ?? 'ARS',
    customer: {
      ...parsed.customer,
      email: parsed.customer?.email ?? null,
    },
    products,
    payments,
  } as TiendaNubeOrder;
}

/**
 * Validates and parses a Tienda Nube order
 * @param data - The order data to validate
 * @returns Parsed and validated order
 * @throws ZodError if validation fails
 */
export function validateTiendaNubeOrder(data: unknown): TiendaNubeOrder {
  const parsed = tiendaNubeOrderSchema.parse(data, undefined);
  return normalizeOrder(parsed);
}

/**
 * Safely validates a Tienda Nube order without throwing
 * @param data - The order data to validate
 * @returns Result object with success status and data or error
 */
export function safeParseTiendaNubeOrder(data: unknown): OrderSafeParse {
  const result = tiendaNubeOrderSchema.safeParse(data, undefined);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    data: normalizeOrder(result.data),
  };
}

// Webhook Payload Validation
export const webhookPayloadSchema = z.object({
  store_id: z.string(),
  event: z.string(),
  id: z.number(),
});

// OAuth Token Response Validation
export const oauthTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('bearer'),
  scope: z.string(),
  user_id: z.number(),
});

// Settings Update Validation
export const settingsUpdateSchema = z.object({
  tiendaNubeFeePercentage: z.number().min(0).max(100).optional(),
  defaultAdvertisingCost: z.number().min(0).optional(),
  paymentGatewayFees: z.record(z.string(), z.number()).optional(),
  syncEnabled: z.boolean().optional(),
});

// Date Range Validation
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Pagination Validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(200).default(50),
});

// API Error Response Validation
export const apiErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  description: z.string().optional(),
});

export function validateWebhookPayload(data: unknown) {
  return webhookPayloadSchema.parse(data);
}

export function validateOAuthToken(data: unknown) {
  return oauthTokenSchema.parse(data);
}

export function validateSettingsUpdate(data: unknown) {
  return settingsUpdateSchema.parse(data);
}

/**
 * Validates a Tienda Nube order without throwing
 * (alias maintained for backwards compatibility)
 */
export const parseTiendaNubeOrder = validateTiendaNubeOrder;

/**
 * Validates environment variables at startup
 * @throws Error if required variables are missing
 */
export function validateEnv() {
  const requiredEnvVars = [
    'TIENDANUBE_CLIENT_ID',
    'TIENDANUBE_CLIENT_SECRET',
    'TIENDANUBE_REDIRECT_URI',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Validate encryption key format
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be 64 characters (32 bytes in hex format). Generate with: openssl rand -hex 32'
    );
  }
}
