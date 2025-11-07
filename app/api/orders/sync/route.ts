import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getAccessToken } from '@/lib/auth/session';
import { createAPIClient } from '@/lib/api/tiendanube';
import { transformOrderToSale } from '@/lib/api/transformer';
import { createOrder, getSettingsByUserId, updateSyncLog, createSyncLog } from '@/lib/db/queries';
import { safeParseTiendaNubeOrder } from '@/lib/utils/validation';
import type { TiendaNubeOrder } from '@/types/api';
import prisma from '@/lib/db/client';

/**
 * Syncs orders from Tienda Nube
 * POST /api/orders/sync
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user || !user.storeId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    // Get user settings
    const settings = await getSettingsByUserId(user.id);

    // Create sync log
    const syncLog = await createSyncLog({
      userId: user.id,
      type: 'manual',
      status: 'started',
    });

    try {
      // Create API client
      const apiClient = createAPIClient(user.storeId, accessToken);

      // Fetch orders from last 90 days (initial sync)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Fetch all orders regardless of status (open, closed, cancelled)
      const orders = await apiClient.getAllOrders({
        created_at_min: ninetyDaysAgo.toISOString(),
      });

      console.log(`Fetched ${orders.length} orders from Tienda Nube`);

      // If no orders found, complete successfully
      if (orders.length === 0) {
        await updateSyncLog(syncLog.id, {
          status: 'completed',
          ordersCount: 0,
          errorMessage: 'No orders found in the specified period',
        });

        return NextResponse.json({
          success: true,
          ordersImported: 0,
          errors: 0,
          total: 0,
          message: 'No orders found to sync. Try creating a test order in your Tienda Nube store.',
        });
      }

      // Transform and save orders
      let savedCount = 0;
      let errorCount = 0;

      for (const order of orders) {
        try {
          // Validate order data
          const validationResult = safeParseTiendaNubeOrder(order);
          if (!validationResult.success) {
            console.warn(
              `Order ${order.number ?? 'unknown'} failed validation:`,
              validationResult.error.format()
            );
            errorCount++;
            continue;
          }

          const normalizedOrder = validationResult.data as TiendaNubeOrder;

          console.log('[Sync] Processing order', {
            id: normalizedOrder.id,
            number: normalizedOrder.number,
            status: normalizedOrder.status,
            payment_status: normalizedOrder.payment_status,
            created_at: normalizedOrder.created_at,
          });

          // Check if order already exists
          const existingOrder = await prisma.order.findUnique({
            where: { tiendanubeId: normalizedOrder.id },
          });

          if (existingOrder) {
            console.log(
              `[Sync] Order ${normalizedOrder.number} (ID ${normalizedOrder.id}) already exists, skipping`
            );
            continue;
          }

          // Fetch real shipping cost from Fulfillment Orders API
          let realShippingCost: number | undefined;
          try {
            const fulfillmentOrders = await apiClient.getFulfillmentOrders(normalizedOrder.id);
            if (fulfillmentOrders && fulfillmentOrders.length > 0) {
              const firstFulfillment = fulfillmentOrders[0];
              const merchantCost = firstFulfillment?.shipping?.merchant_cost?.value;
              if (merchantCost !== undefined && merchantCost !== null) {
                realShippingCost = Number(merchantCost);
                console.log(`[Sync] Order ${normalizedOrder.number}: Real shipping cost from API: $${realShippingCost}`);
              }
            }
          } catch (fulfillmentError) {
            console.warn(`[Sync] Could not fetch fulfillment orders for ${normalizedOrder.number}:`, fulfillmentError);
            // Continue with fallback shipping cost calculation
          }

          // Transform order to Sale format
          const sale = transformOrderToSale(normalizedOrder, {
            tiendaNubeFeePercentage: settings?.tiendaNubeFeePercentage || 5.31,
            paymentGatewayFees: settings?.paymentGatewayFees
              ? JSON.parse(JSON.stringify(settings.paymentGatewayFees))
              : undefined,
            advertisingCost: 0, // Will be set manually later
            realShippingCost, // Pass real shipping cost from Fulfillment Orders API
          });

          // Save to database
          await createOrder({
            tiendanubeId: normalizedOrder.id,
            orderNumber: normalizedOrder.number,
            userId: user.id,
            date: new Date(normalizedOrder.created_at),
            customerName: sale.customerName,
            customerEmail: normalizedOrder.customer.email ?? null,
            grossRevenue: sale.grossRevenue,
            tiendaNubeFee: sale.tiendaNubeFee,
            paymentFee: sale.paymentFee,
            shippingCost: sale.shippingCost,
            productCost: sale.productCost,
            advertisingCost: sale.advertisingCost,
            netRevenue: sale.netRevenue,
            netMargin: sale.netMargin,
            paymentMethod: sale.paymentMethod,
            paymentGateway: normalizedOrder.gateway,
            shippingMethod: sale.shippingMethod ?? '',
            currency: sale.currency,
            status: normalizedOrder.status,
            paymentStatus: normalizedOrder.payment_status,
            rawData: normalizedOrder as any,
            products: sale.products.map((p, index) => {
              const originalProduct = normalizedOrder.products[index];
              return {
                productId: p.id,
                variantId: originalProduct?.variant_id
                  ? originalProduct.variant_id.toString()
                  : undefined,
                name: p.name,
                sku: p.sku || originalProduct?.sku || '',
                quantity: p.quantity,
                price: p.price,
                cost: p.cost,
                total: p.total,
              };
            }),
          });

          savedCount++;
        } catch (orderError) {
          console.error(`Error saving order ${order.number}:`, orderError);
          errorCount++;
        }
      }

      console.log('[Sync] Summary', {
        totalFetched: orders.length,
        savedCount,
        errorCount,
      });

      // Update sync log
      await updateSyncLog(syncLog.id, {
        status: 'completed',
        ordersCount: savedCount,
        errorMessage: errorCount > 0 ? `${errorCount} orders failed to save` : undefined,
      });

      // Update settings with last sync time
      await prisma.settings.update({
        where: { userId: user.id },
        data: { lastSyncAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        ordersImported: savedCount,
        errors: errorCount,
        total: orders.length,
      });
    } catch (syncError) {
      // Update sync log with error
      await updateSyncLog(syncLog.id, {
        status: 'failed',
        errorMessage: syncError instanceof Error ? syncError.message : 'Unknown error',
      });

      throw syncError;
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
