import axios, { AxiosInstance, AxiosError } from 'axios';
import { getRateLimiter } from './rate-limiter';
import {
  TiendaNubeOrder,
  TiendaNubeStore,
  TiendaNubeWebhook,
  TiendaNubeOAuthTokenResponse,
  RateLimitInfo,
} from '@/types/api';
import {
  validateTiendaNubeOrder,
  validateOAuthToken,
} from '../utils/validation';

const BASE_URL = 'https://api.tiendanube.com/v1';
const OAUTH_URL = 'https://www.tiendanube.com/apps/authorize/token';

export class TiendaNubeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'TiendaNubeAPIError';
  }
}

export class TiendaNubeAPIClient {
  private client: AxiosInstance;
  private storeId: string;
  private rateLimiter = getRateLimiter();

  constructor(storeId: string, accessToken: string) {
    this.storeId = storeId;

    this.client = axios.create({
      baseURL: `${BASE_URL}/${storeId}`,
      headers: {
        Authentication: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PNL-TiendaNube-App/1.0',
      },
      timeout: 30000, // 30 seconds
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Handles API errors
   */
  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      if (status === 429) {
        throw new TiendaNubeAPIError(
          'Rate limit exceeded. Please try again later.',
          429,
          data
        );
      }

      if (status === 401) {
        throw new TiendaNubeAPIError(
          'Authentication failed. Please reconnect your store.',
          401,
          data
        );
      }

      if (status === 404) {
        throw new TiendaNubeAPIError('Resource not found', 404, data);
      }

      if (status >= 500) {
        throw new TiendaNubeAPIError(
          'Tienda Nube API is temporarily unavailable',
          status,
          data
        );
      }

      throw new TiendaNubeAPIError(
        data?.message || 'API request failed',
        status,
        data
      );
    }

    if (error.request) {
      throw new TiendaNubeAPIError('No response from Tienda Nube API');
    }

    throw new TiendaNubeAPIError('Failed to make API request');
  }

  /**
   * Extracts rate limit info from response headers
   */
  private extractRateLimitInfo(headers: any): RateLimitInfo | null {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }

    return null;
  }

  /**
   * Fetches orders with pagination and filters
   */
  async getOrders(params?: {
    since_id?: number;
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    status?: 'open' | 'closed' | 'cancelled';
    per_page?: number;
    page?: number;
  }): Promise<TiendaNubeOrder[]> {
    await this.rateLimiter.throttle();

    const response = await this.client.get<TiendaNubeOrder[]>('/orders', {
      params: {
        per_page: 200, // Max per request
        ...params,
      },
    });

    const rateLimitInfo = this.extractRateLimitInfo(response.headers);
    if (rateLimitInfo && rateLimitInfo.remaining < 10) {
      console.warn(
        `Low rate limit remaining: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}`
      );
    }

    // Validate each order
    const validatedOrders = response.data.map((order) =>
      validateTiendaNubeOrder(order)
    );

    if (params?.page === undefined || params?.page === 1) {
      const preview = validatedOrders.slice(0, 5).map((order) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
      }));
      console.log('[TiendaNube] Sample orders from API:', preview);
    }

    return validatedOrders;
  }

  /**
   * Fetches a single order by ID
   */
  async getOrder(orderId: number): Promise<TiendaNubeOrder> {
    await this.rateLimiter.throttle();

    const response = await this.client.get<TiendaNubeOrder>(
      `/orders/${orderId}`
    );
    return validateTiendaNubeOrder(response.data);
  }

  /**
   * Fetches store information
   */
  async getStore(): Promise<TiendaNubeStore> {
    await this.rateLimiter.throttle();

    const response = await this.client.get<TiendaNubeStore>('/store');
    return response.data;
  }

  /**
   * Registers a webhook
   */
  async createWebhook(
    event: string,
    url: string
  ): Promise<TiendaNubeWebhook> {
    await this.rateLimiter.throttle();

    const response = await this.client.post<TiendaNubeWebhook>('/webhooks', {
      event,
      url,
    });

    return response.data;
  }

  /**
   * Lists all registered webhooks
   */
  async getWebhooks(): Promise<TiendaNubeWebhook[]> {
    await this.rateLimiter.throttle();

    const response = await this.client.get<TiendaNubeWebhook[]>('/webhooks');
    return response.data;
  }

  /**
   * Deletes a webhook
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    await this.rateLimiter.throttle();

    await this.client.delete(`/webhooks/${webhookId}`);
  }

  /**
   * Fetches fulfillment orders for a specific order
   * Returns shipping cost information including merchant_cost and consumer_cost
   */
  async getFulfillmentOrders(orderId: number): Promise<any[]> {
    await this.rateLimiter.throttle();

    try {
      const response = await this.client.get(`/orders/${orderId}/fulfillment-orders`);
      return response.data || [];
    } catch (error) {
      // Fulfillment orders might not exist for all orders
      if (error instanceof TiendaNubeAPIError && error.statusCode === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Fetches all orders with automatic pagination
   */
  async getAllOrders(filters?: {
    created_at_min?: string;
    created_at_max?: string;
    status?: 'open' | 'closed' | 'cancelled';
  }): Promise<TiendaNubeOrder[]> {
    const allOrders: TiendaNubeOrder[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const orders = await this.getOrders({
          ...filters,
          page,
          per_page: 200,
        });

        allOrders.push(...orders);

        // If we got less than 200, we've reached the end
        hasMore = orders.length === 200;
        page++;

        // Safety limit to prevent infinite loops
        if (page > 100) {
          console.warn('Reached maximum page limit (100)');
          break;
        }
      } catch (error) {
        // Handle 404 error (no orders found or last page reached)
        const is404 =
          (error instanceof TiendaNubeAPIError && error.statusCode === 404) ||
          (error && typeof error === 'object' && 'statusCode' in error && (error as any).statusCode === 404) ||
          (error && typeof error === 'object' && 'status' in error && (error as any).status === 404);

        if (is404) {
          console.log(`No more orders found at page ${page} (404 response)`);
          hasMore = false;
        } else {
          console.error(`Error fetching orders at page ${page}:`, error);
          throw error;
        }
      }
    }

    return allOrders;
  }
}

/**
 * Exchanges authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<TiendaNubeOAuthTokenResponse> {
  const rateLimiter = getRateLimiter();
  await rateLimiter.throttle();

  try {
    const response = await axios.post<TiendaNubeOAuthTokenResponse>(
      OAUTH_URL,
      {
        client_id: process.env.TIENDANUBE_CLIENT_ID,
        client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return validateOAuthToken(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new TiendaNubeAPIError(
        'Failed to exchange code for token',
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
}

/**
 * Gets the OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const clientId = process.env.TIENDANUBE_CLIENT_ID!;
  const redirectUri = process.env.TIENDANUBE_REDIRECT_URI!;

  // Tienda Nube OAuth URL format with explicit redirect_uri
  return `https://www.tiendanube.com/apps/${clientId}/authorize?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Creates a new API client instance
 */
export function createAPIClient(
  storeId: string,
  accessToken: string
): TiendaNubeAPIClient {
  return new TiendaNubeAPIClient(storeId, accessToken);
}
