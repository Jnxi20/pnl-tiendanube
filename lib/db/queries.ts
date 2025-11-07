import prisma from './client';
import { Prisma } from '@prisma/client';
import type { Order, Settings, User } from '@prisma/client';

// User Queries
export async function getUserByStoreId(storeId: string) {
  return prisma.user.findUnique({
    where: { storeId },
    include: {
      accounts: true,
      settings: true,
    },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
    },
  });
}

export async function createUser(data: {
  storeId: string;
  storeName?: string;
  email?: string;
  name?: string;
}) {
  return prisma.user.create({
    data,
  });
}

// Order Queries
export async function getOrdersByUserId(
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  return prisma.order.findMany({
    where: {
      userId,
      ...(filters?.startDate || filters?.endDate
        ? {
            date: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      products: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: filters?.limit,
    skip: filters?.offset,
  });
}

export async function getOrderByTiendanubeId(
  tiendanubeId: number,
  userId: string
) {
  return prisma.order.findFirst({
    where: {
      tiendanubeId,
      userId,
    },
    include: {
      products: true,
    },
  });
}

export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'rawData'> & {
    rawData?: Prisma.InputJsonValue | null;
    products: Array<{
      productId: string;
      variantId?: string;
      name: string;
      sku?: string;
      quantity: number;
      price: number;
      cost: number;
      total: number;
    }>;
  }
) {
  const { products, rawData, ...orderData } = data;

  return prisma.order.create({
    data: {
      ...orderData,
      ...(rawData !== undefined
        ? { rawData: rawData ?? Prisma.JsonNull }
        : {}),
      products: {
        create: products,
      },
    },
    include: {
      products: true,
    },
  });
}

export async function updateOrder(
  tiendanubeId: number,
  userId: string,
  data: Partial<
    Omit<Order, 'id' | 'tiendanubeId' | 'userId' | 'createdAt' | 'updatedAt' | 'rawData'>
  > & { rawData?: Prisma.InputJsonValue | null }
) {
  const { rawData, ...updateData } = data;

  return prisma.order.update({
    where: {
      tiendanubeId,
    },
    data: {
      ...updateData,
      ...(rawData !== undefined
        ? { rawData: rawData ?? Prisma.JsonNull }
        : {}),
      updatedAt: new Date(),
    },
    include: {
      products: true,
    },
  });
}

export async function deleteOrder(tiendanubeId: number, userId: string) {
  return prisma.order.delete({
    where: {
      tiendanubeId,
    },
  });
}

// Settings Queries
export async function getSettingsByUserId(userId: string) {
  return prisma.settings.findUnique({
    where: { userId },
  });
}

export async function createOrUpdateSettings(
  userId: string,
  data: Partial<Omit<Settings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
) {
  const { paymentGatewayFees, ...rest } = data;

  return prisma.settings.upsert({
    where: { userId },
    update: {
      ...rest,
      ...(paymentGatewayFees !== undefined
        ? { paymentGatewayFees: paymentGatewayFees ?? Prisma.JsonNull }
        : {}),
      updatedAt: new Date(),
    },
    create: {
      userId,
      ...rest,
      ...(paymentGatewayFees !== undefined
        ? { paymentGatewayFees: paymentGatewayFees ?? Prisma.JsonNull }
        : {}),
    },
  });
}

// Webhook Queries
export async function createWebhookLog(data: {
  event: string;
  payload: any;
}) {
  return prisma.webhook.create({
    data,
  });
}

export async function markWebhookAsProcessed(
  webhookId: string,
  error?: string
) {
  return prisma.webhook.update({
    where: { id: webhookId },
    data: {
      processed: true,
      processedAt: new Date(),
      error,
    },
  });
}

export async function getPendingWebhooks(limit: number = 100) {
  return prisma.webhook.findMany({
    where: { processed: false },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

// Sync Log Queries
export async function createSyncLog(data: {
  userId: string;
  type: 'initial' | 'incremental' | 'webhook' | 'manual';
  status: 'started' | 'completed' | 'failed';
  ordersCount?: number;
  errorMessage?: string;
}) {
  return prisma.syncLog.create({
    data: {
      ...data,
      startedAt: new Date(),
    },
  });
}

export async function updateSyncLog(
  syncLogId: string,
  data: {
    status: 'completed' | 'failed';
    ordersCount?: number;
    errorMessage?: string;
  }
) {
  return prisma.syncLog.update({
    where: { id: syncLogId },
    data: {
      ...data,
      completedAt: new Date(),
    },
  });
}

export async function getLastSuccessfulSync(userId: string) {
  return prisma.syncLog.findFirst({
    where: {
      userId,
      status: 'completed',
    },
    orderBy: {
      completedAt: 'desc',
    },
  });
}

// Analytics Queries
export async function getOrderStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const orders = await getOrdersByUserId(userId, { startDate, endDate });

  const stats = orders.reduce(
    (acc, order) => {
      acc.totalOrders += 1;
      acc.totalGrossRevenue += order.grossRevenue;
      acc.totalNetRevenue += order.netRevenue;
      acc.totalCosts +=
        order.tiendaNubeFee +
        order.paymentFee +
        order.shippingCost +
        order.productCost +
        order.advertisingCost;

      return acc;
    },
    {
      totalOrders: 0,
      totalGrossRevenue: 0,
      totalNetRevenue: 0,
      totalCosts: 0,
    }
  );

  return {
    ...stats,
    averageOrderValue:
      stats.totalOrders > 0 ? stats.totalGrossRevenue / stats.totalOrders : 0,
    profitMargin:
      stats.totalGrossRevenue > 0
        ? (stats.totalNetRevenue / stats.totalGrossRevenue) * 100
        : 0,
  };
}
