import { v4 as uuidv4 } from 'uuid';
import {
  TiendaNubeOrder,
  TiendaNubeProduct,
  TiendaNubePayment,
} from '@/types/api';
import { Sale, Product } from '@/types';

// Default payment gateway fees (in percentage)
// These can be overridden by user settings
// Note: Pago Nube fees include installment costs (cuotas sin interés)
// which can be 10-15% depending on the number of installments
export const DEFAULT_PAYMENT_GATEWAY_FEES: Record<string, number> = {
  mercadopago: 4.99,
  mercadopago_transparent: 4.99,
  mobbex: 3.99,
  payway: 3.5,
  todo_pago: 4.5,
  payu: 3.99,
  decidir: 3.5,
  'pago-nube': 11.18, // Includes installment fees (cuotas) - based on real data
  transferencia: 0,
  efectivo: 0,
  bank_transfer: 0,
  cash: 0,
  manual: 0,
};

// Default Tienda Nube commission (5.31% based on real data)
// This is the platform fee charged by Tienda Nube
const DEFAULT_TIENDANUBE_FEE_PERCENTAGE = 5.31;

type NumericInput =
  | string
  | number
  | null
  | undefined
  | Record<string, unknown>;

function normalizeDecimal(value: string) {
  return value.replace(',', '.');
}

function toNumber(value: NumericInput): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = parseFloat(normalizeDecimal(trimmed));
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidates = ['amount', 'value', 'total', 'price', 'fee', 'net'];
    for (const key of candidates) {
      if (key in obj) {
        const parsed = toNumber(obj[key] as NumericInput);
        if (parsed !== null) {
          return parsed;
        }
      }
    }
  }

  return null;
}

function findNumericByRegex(
  value: unknown,
  regex: RegExp,
  depth = 0,
  maxDepth = 3
): number | null {
  if (!value || depth > maxDepth) {
    return null;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    for (const [key, child] of entries) {
      if (regex.test(key)) {
        const directValue = toNumber(child as NumericInput);
        if (directValue !== null) {
          return directValue;
        }
      }

      const nested = findNumericByRegex(child, regex, depth + 1, maxDepth);
      if (nested !== null) {
        return nested;
      }
    }
  }

  return null;
}

function calculateShippingCost(order: TiendaNubeOrder): number {
  const ownerCost = toNumber(order.shipping_cost_owner);
  if (ownerCost !== null) {
    return ownerCost;
  }

  const storeCost = toNumber(order.shipping_cost_store);
  if (storeCost !== null) {
    return storeCost;
  }

  const fallbackShipping = toNumber(order.shipping);
  if (fallbackShipping !== null) {
    return fallbackShipping;
  }

  return 0;
}

function sumPaymentGatewayFees(payments?: TiendaNubePayment[]): number | null {
  if (!payments || payments.length === 0) {
    return null;
  }

  let hasDetailedData = false;

  const total = payments.reduce((sum, payment) => {
    let paymentHasExplicitFees = false;
    const gatewayFee = toNumber(payment.gateway_fee as NumericInput);
    const installmentsCost = toNumber(
      payment.installments_cost as NumericInput
    );
    const discountGateway = toNumber(
      (payment as Record<string, unknown>).discount_gateway as NumericInput
    );
    const otherFee = toNumber(
      (payment as Record<string, unknown>).fee as NumericInput
    );

    let paymentTotal = 0;
    if (gatewayFee !== null) {
      paymentTotal += gatewayFee;
      paymentHasExplicitFees = true;
    }
    if (installmentsCost !== null) {
      paymentTotal += installmentsCost;
      paymentHasExplicitFees = true;
    }
    if (discountGateway !== null) {
      paymentTotal += discountGateway;
      paymentHasExplicitFees = true;
    }
    if (otherFee !== null) {
      paymentTotal += otherFee;
      paymentHasExplicitFees = true;
    }

    if (!paymentHasExplicitFees) {
      const transactionAmount = toNumber(payment.transaction_amount);
      const netAmount = toNumber(payment.net_amount);
      if (
        transactionAmount !== null &&
        netAmount !== null &&
        transactionAmount > netAmount
      ) {
        paymentTotal += transactionAmount - netAmount;
        paymentHasExplicitFees = true;
      }
    }

    if (paymentHasExplicitFees) {
      hasDetailedData = true;
    }

    return sum + paymentTotal;
  }, 0);

  return hasDetailedData || total > 0 ? total : null;
}

function extractTiendaNubeFee(
  order: TiendaNubeOrder,
  grossRevenue: number,
  fallbackPercentage: number
): number {
  const directKeys = [
    'tiendanube_fee',
    'tiendanube_commission',
    'store_commission',
    'platform_fee',
  ];

  for (const key of directKeys) {
    const value = toNumber(
      (order as unknown as Record<string, unknown>)[key] as NumericInput
    );
    if (value !== null) {
      return value;
    }
  }

  const extraCommission = findNumericByRegex(
    order.extra,
    /(commission|comision|tienda)/i
  );
  if (extraCommission !== null) {
    return extraCommission;
  }

  return (grossRevenue * fallbackPercentage) / 100;
}

/**
 * Maps Tienda Nube payment status to Sale status
 */
function mapPaymentStatus(
  paymentStatus: string,
  orderStatus: string
): 'paid' | 'pending' | 'cancelled' {
  if (orderStatus === 'cancelled') {
    return 'cancelled';
  }

  switch (paymentStatus) {
    case 'paid':
    case 'authorized':
      return 'paid';
    case 'voided':
    case 'refunded':
      return 'cancelled';
    case 'pending':
    default:
      return 'pending';
  }
}

/**
 * Gets payment fee percentage for a given gateway
 */
function getPaymentFeePercentage(
  gateway: string,
  customFees?: Record<string, number>
): number {
  if (customFees && gateway in customFees) {
    return customFees[gateway];
  }

  // Normalize gateway name (lowercase, remove special chars)
  const normalizedGateway = gateway.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Try to find a match
  for (const [key, percentage] of Object.entries(DEFAULT_PAYMENT_GATEWAY_FEES)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedGateway.includes(normalizedKey)) {
      return percentage;
    }
  }

  // Default to 3.5% if not found
  console.warn(`Unknown payment gateway: ${gateway}, using default 3.5%`);
  return 3.5;
}

/**
 * Transforms Tienda Nube product to Sale product
 */
function transformProduct(product: TiendaNubeProduct): Product {
  const price = toNumber(product.price) ?? 0;
  const cost = toNumber(product.cost) ?? 0;
  const quantity = product.quantity;
  const total = price * quantity;

  return {
    id: product.product_id.toString(),
    name: product.name,
    sku: product.sku || '',
    quantity,
    price,
    cost,
    total,
  };
}

/**
 * Transforms Tienda Nube order to Sale
 */
export function transformOrderToSale(
  order: TiendaNubeOrder,
  options?: {
    tiendaNubeFeePercentage?: number;
    paymentGatewayFees?: Record<string, number>;
    advertisingCost?: number;
    realShippingCost?: number; // Real shipping cost from Fulfillment Orders API
  }
): Sale {
  const grossRevenue = toNumber(order.total) ?? 0;
  // Use real shipping cost if provided, otherwise calculate from order
  const shippingCost = options?.realShippingCost ?? calculateShippingCost(order);

  // Calculate product cost from order items
  const productCost = order.products.reduce((sum, product) => {
    const cost = toNumber(product.cost) ?? 0;
    return sum + cost * product.quantity;
  }, 0);

  // Calculate Tienda Nube fee
  const tiendaNubeFeePercentage =
    options?.tiendaNubeFeePercentage || DEFAULT_TIENDANUBE_FEE_PERCENTAGE;
  const tiendaNubeFee = extractTiendaNubeFee(
    order,
    grossRevenue,
    tiendaNubeFeePercentage
  );

  // Calculate payment fee
  const paymentFeeFromOrder = sumPaymentGatewayFees(order.payments);
  const paymentFee =
    paymentFeeFromOrder !== null
      ? paymentFeeFromOrder
      : (grossRevenue *
          getPaymentFeePercentage(order.gateway, options?.paymentGatewayFees)) /
        100;

  // Advertising cost (usually manual entry, divided across orders)
  const advertisingCost = options?.advertisingCost || 0;

  // Calculate net revenue
  const totalCosts =
    tiendaNubeFee +
    paymentFee +
    shippingCost +
    productCost +
    advertisingCost;
  const netRevenue = grossRevenue - totalCosts;

  // Calculate margin
  const netMargin = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0;

  // Transform products
  const products = order.products.map(transformProduct);

  // Map status
  const status = mapPaymentStatus(order.payment_status, order.status);

  return {
    id: uuidv4(), // Generate unique ID for frontend
    orderNumber: order.number,
    date: order.created_at,
    customerName: order.customer.name,
    grossRevenue,
    tiendaNubeFee,
    paymentFee,
    shippingCost,
    productCost,
    advertisingCost,
    netRevenue,
    netMargin,
    paymentMethod: order.gateway_name || order.gateway,
    shippingMethod: order.shipping_option,
    products,
    currency: order.currency,
    status,
  };
}

export function getOrderFinancialBreakdown(
  order: TiendaNubeOrder,
  options?: {
    tiendaNubeFeePercentage?: number;
    paymentGatewayFees?: Record<string, number>;
  }
) {
  const grossRevenue = toNumber(order.total) ?? 0;
  const subtotal = toNumber(order.subtotal) ?? 0;
  const discountCoupon = toNumber(order.discount_coupon) ?? 0;
  const discountGateway = toNumber(order.discount_gateway) ?? 0;
  const generalDiscount = toNumber(order.discount) ?? 0;
  const shippingCustomer = toNumber(order.shipping_cost_customer) ?? 0;
  const shippingOwner = toNumber(order.shipping_cost_owner) ?? shippingCustomer;

  const tiendaNubeFeePercentage =
    options?.tiendaNubeFeePercentage || DEFAULT_TIENDANUBE_FEE_PERCENTAGE;
  const tiendaNubeFee = extractTiendaNubeFee(
    order,
    grossRevenue,
    tiendaNubeFeePercentage
  );

  const paymentFeeFromOrder = sumPaymentGatewayFees(order.payments);
  const paymentFee =
    paymentFeeFromOrder !== null
      ? paymentFeeFromOrder
      : (grossRevenue *
          getPaymentFeePercentage(order.gateway, options?.paymentGatewayFees)) /
        100;

  const productCost = order.products.reduce((sum, product) => {
    const cost = toNumber(product.cost) ?? 0;
    return sum + cost * product.quantity;
  }, 0);

  return {
    grossRevenue,
    subtotal,
    shipping: {
      customer: shippingCustomer,
      owner: shippingOwner,
      delta: shippingCustomer - shippingOwner,
    },
    discounts: {
      total: generalDiscount,
      coupon: discountCoupon,
      gateway: discountGateway,
    },
    tiendaNubeFee,
    paymentFee,
    productCost,
    payments: order.payments?.map((payment) => ({
      id: payment.id,
      status: payment.status,
      gateway: payment.gateway,
      method: payment.payment_method,
      gatewayFee: toNumber(payment.gateway_fee as NumericInput) ?? 0,
      installmentsCost:
        toNumber(payment.installments_cost as NumericInput) ?? 0,
      transactionAmount:
        toNumber(payment.transaction_amount as NumericInput) ?? 0,
      netAmount: toNumber(payment.net_amount as NumericInput) ?? 0,
    })),
  };
}

/**
 * Transforms multiple orders to sales
 */
export function transformOrdersToSales(
  orders: TiendaNubeOrder[],
  options?: {
    tiendaNubeFeePercentage?: number;
    paymentGatewayFees?: Record<string, number>;
    advertisingCostPerOrder?: number;
  }
): Sale[] {
  return orders.map((order) =>
    transformOrderToSale(order, {
      ...options,
      advertisingCost: options?.advertisingCostPerOrder,
    })
  );
}

/**
 * Calculates advertising cost per order based on total ad spend
 * Distributes ad cost proportionally based on order revenue
 */
export function calculateAdvertisingCostPerOrder(
  orders: TiendaNubeOrder[],
  totalAdSpend: number
): Map<number, number> {
  if (orders.length === 0 || totalAdSpend === 0) {
    return new Map();
  }

  // Calculate total revenue
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (toNumber(order.total) ?? 0),
    0
  );

  if (totalRevenue === 0) {
    return new Map();
  }

  // Distribute ad cost proportionally
  const adCostMap = new Map<number, number>();

  orders.forEach((order) => {
    const orderRevenue = toNumber(order.total) ?? 0;
    const proportion = orderRevenue / totalRevenue;
    const adCost = totalAdSpend * proportion;
    adCostMap.set(order.id, adCost);
  });

  return adCostMap;
}

/**
 * Validates that order has all required data for transformation
 */
export function validateOrderForTransformation(
  order: TiendaNubeOrder
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (toNumber(order.total) === null) {
    errors.push('Order total is missing or invalid');
  }

  if (!order.customer?.name) {
    errors.push('Customer name is missing');
  }

  if (!order.products || order.products.length === 0) {
    errors.push('Order has no products');
  }

  order.products?.forEach((product, index) => {
    if (toNumber(product.price) === null) {
      errors.push(`Product ${index + 1} has invalid price`);
    }
    if (product.quantity <= 0) {
      errors.push(`Product ${index + 1} has invalid quantity`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
