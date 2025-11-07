import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookPayload } from '@/lib/utils/validation';
import { createWebhookLog, markWebhookAsProcessed, getUserByStoreId } from '@/lib/db/queries';
import { createAPIClient } from '@/lib/api/tiendanube';
import { transformOrderToSale } from '@/lib/api/transformer';
import { createOrder } from '@/lib/db/queries';
import prisma from '@/lib/db/client';
import { decryptToken } from '@/lib/utils/encryption';

/**
 * Handles webhooks from Tienda Nube
 * POST /api/webhooks/orders
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('Received webhook:', payload);

    // Validate webhook payload
    const validatedPayload = validateWebhookPayload(payload);
    const { store_id, event, id: orderId } = validatedPayload;

    // Log webhook
    const webhookLog = await createWebhookLog({
      event,
      payload,
    });

    try {
      // Find user by store ID
      const user = await getUserByStoreId(store_id);

      if (!user) {
        console.error(`User not found for store_id: ${store_id}`);
        await markWebhookAsProcessed(webhookLog.id, 'User not found');
        return NextResponse.json({ received: true });
      }

      // Get user's access token
      const account = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: 'tiendanube',
        },
      });

      if (!account?.access_token) {
        console.error(`Access token not found for user: ${user.id}`);
        await markWebhookAsProcessed(webhookLog.id, 'Access token not found');
        return NextResponse.json({ received: true });
      }

      // Decrypt access token
      const accessToken = decryptToken(account.access_token);

      // Create API client
      const apiClient = createAPIClient(store_id, accessToken);

      // Fetch the order
      const order = await apiClient.getOrder(orderId);

      // Check if order already exists
      const existingOrder = await prisma.order.findUnique({
        where: { tiendanubeId: order.id },
      });

      // Get user settings
      const settings = await prisma.settings.findUnique({
        where: { userId: user.id },
      });

      // Transform order
      const sale = transformOrderToSale(order, {
        tiendaNubeFeePercentage: settings?.tiendaNubeFeePercentage || 3.0,
        paymentGatewayFees: settings?.paymentGatewayFees
          ? JSON.parse(JSON.stringify(settings.paymentGatewayFees))
          : undefined,
        advertisingCost: 0,
      });

      if (event === 'order/paid' || event === 'order/updated') {
        if (existingOrder) {
          // Update existing order
          await prisma.order.update({
            where: { tiendanubeId: order.id },
            data: {
              orderNumber: order.number,
              date: new Date(order.created_at),
              customerName: sale.customerName,
              customerEmail: order.customer.email ?? null,
              grossRevenue: sale.grossRevenue,
              tiendaNubeFee: sale.tiendaNubeFee,
              paymentFee: sale.paymentFee,
              shippingCost: sale.shippingCost,
              productCost: sale.productCost,
              netRevenue: sale.netRevenue,
              netMargin: sale.netMargin,
              paymentMethod: sale.paymentMethod,
              paymentGateway: order.gateway,
              shippingMethod: sale.shippingMethod ?? '',
              currency: sale.currency,
              status: order.status,
              paymentStatus: order.payment_status,
              rawData: order as any,
              updatedAt: new Date(),
            },
          });

          console.log(`Updated order ${order.number}`);
        } else {
          // Create new order
          await createOrder({
            tiendanubeId: order.id,
            orderNumber: order.number,
            userId: user.id,
            date: new Date(order.created_at),
            customerName: sale.customerName,
            customerEmail: order.customer.email ?? null,
            grossRevenue: sale.grossRevenue,
            tiendaNubeFee: sale.tiendaNubeFee,
            paymentFee: sale.paymentFee,
            shippingCost: sale.shippingCost,
            productCost: sale.productCost,
            advertisingCost: sale.advertisingCost,
            netRevenue: sale.netRevenue,
            netMargin: sale.netMargin,
            paymentMethod: sale.paymentMethod,
            paymentGateway: order.gateway,
            shippingMethod: sale.shippingMethod ?? '',
            currency: sale.currency,
            status: order.status,
            paymentStatus: order.payment_status,
            rawData: order as any,
            products: sale.products.map((p, index) => {
              const originalProduct = order.products[index];
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

          console.log(`Created order ${order.number}`);
        }
      } else if (event === 'order/cancelled') {
        if (existingOrder) {
          // Update order status to cancelled
          await prisma.order.update({
            where: { tiendanubeId: order.id },
            data: {
              status: 'cancelled',
              paymentStatus: 'cancelled',
              updatedAt: new Date(),
            },
          });

          console.log(`Cancelled order ${order.number}`);
        }
      }

      // Mark webhook as processed
      await markWebhookAsProcessed(webhookLog.id);

      return NextResponse.json({ success: true });
    } catch (processingError) {
      console.error('Webhook processing error:', processingError);

      // Mark webhook as processed with error
      await markWebhookAsProcessed(
        webhookLog.id,
        processingError instanceof Error ? processingError.message : 'Unknown error'
      );

      // Return success anyway to prevent Tienda Nube from retrying
      return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Webhook error:', error);

    // Return 200 to prevent retries for invalid payloads
    return NextResponse.json({ received: true });
  }
}

/**
 * Health check endpoint
 * GET /api/webhooks/orders
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is active',
  });
}
