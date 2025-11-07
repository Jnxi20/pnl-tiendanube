// Tienda Nube API Response Types

export interface TiendaNubeCustomer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string;
  identification?: string;
}

export interface TiendaNubeProduct {
  id: number;
  product_id: number;
  variant_id: number | null;
  name: string;
  sku?: string;
  quantity: number;
  price: string;
  cost?: string;
  weight?: string;
  depth?: string;
  height?: string;
  width?: string;
}

export interface TiendaNubePayment {
  id: number;
  status: 'pending' | 'authorized' | 'paid' | 'voided' | 'refunded' | 'abandoned';
  payment_method: string;
  payment_type?: string | null;
  gateway: string;
  installments?: number | null;
  installment_amount?: string | null;
  gateway_fee?: string | null;
  installments_cost?: string | null;
  net_amount?: string | null;
  total?: string | null;
  transaction_amount?: string | null;
  authorization_code?: string | null;
  external_reference?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface TiendaNubeShippingAddress {
  address: string;
  city: string;
  country: string;
  created_at: string;
  default: boolean;
  floor?: string;
  id: number;
  locality?: string;
  number: string;
  phone?: string;
  province: string;
  updated_at: string;
  zipcode: string;
}

export interface TiendaNubeOrder {
  id: number;
  number: number;
  token: string;
  store_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: {
    date: string;
    timezone_type: number;
    timezone: string;
  } | null;

  // Status
  status: 'open' | 'closed' | 'cancelled';
  payment_status: 'pending' | 'authorized' | 'paid' | 'voided' | 'refunded' | 'abandoned';
  fulfillment_status?: 'unpacked' | 'packed' | 'fulfilled';

  // Financial
  currency: string;
  total: string;
  subtotal: string;
  total_usd: string;
  discount: string;
  discount_coupon?: string;
  discount_gateway?: string;
  total_tax?: string;

  // Payment
  gateway: string;
  gateway_id?: string;
  gateway_name: string;
  gateway_link?: string;

  // Shipping
  shipping: string;
  shipping_option: string;
  shipping_option_code?: string;
  shipping_option_reference?: string;
  shipping_pickup_details?: string;
  shipping_tracking_number?: string;
  shipping_tracking_url?: string;
  shipping_store_branch_name?: string;
  shipping_pickup_type?: string;
  shipping_suboption?: any[];
  shipping_cost_customer?: string;
  shipping_cost_owner?: string;
  shipping_cost_store?: string;

  // Customer
  customer: TiendaNubeCustomer;

  // Products
  products: TiendaNubeProduct[];

  // Payments
  payments?: TiendaNubePayment[];

  // Addresses
  billing_address?: string;
  billing_city?: string;
  billing_country?: string;
  billing_floor?: string;
  billing_locality?: string;
  billing_number?: string;
  billing_phone?: string;
  billing_province?: string;
  billing_zipcode?: string;

  shipping_address?: string;
  shipping_city?: string;
  shipping_country?: string;
  shipping_floor?: string;
  shipping_locality?: string;
  shipping_number?: string;
  shipping_phone?: string;
  shipping_province?: string;
  shipping_zipcode?: string;

  // Additional
  note?: string;
  owner_note?: string;
  cancel_reason?: string;
  language?: string;
  app_id?: number;
  weight?: string;
  extra?: Record<string, unknown>;

  // Timestamps
  paid_at?: string;
  landing_url?: string;
  client_details?: {
    browser_ip: string;
    user_agent: string;
  };

  // Storefront
  storefront?: string;
}

export interface TiendaNubeOAuthTokenResponse {
  access_token: string;
  token_type: 'bearer';
  scope: string;
  user_id: number;
}

export interface TiendaNubeStore {
  id: number;
  name: string;
  url: string;
  email: string;
  phone?: string;
  country: string;
  currency: string;
  language: string;
  business_name?: string;
  business_id?: string;
  address?: string;
  city?: string;
  province?: string;
  zipcode?: string;
  main_currency: string;
  original_domain: string;
  domains: string[];
}

export interface TiendaNubeWebhook {
  id: number;
  event: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface TiendaNubeWebhookPayload {
  store_id: string;
  event: string;
  id: number;
}

// API Error Response
export interface TiendaNubeAPIError {
  code: number;
  message: string;
  description?: string;
}

// Rate Limit Headers
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
}
