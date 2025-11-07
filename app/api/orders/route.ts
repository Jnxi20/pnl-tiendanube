import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getOrdersByUserId } from '@/lib/db/queries';
import type { Sale } from '@/types';

/**
 * Gets orders for the authenticated user
 * GET /api/orders?startDate=xxx&endDate=xxx&status=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Fetch orders
    const orders = await getOrdersByUserId(user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    // Transform database orders to Sale format for frontend
    const sales: Sale[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.date.toISOString(),
      customerName: order.customerName,
      grossRevenue: order.grossRevenue,
      tiendaNubeFee: order.tiendaNubeFee,
      paymentFee: order.paymentFee,
      shippingCost: order.shippingCost,
      productCost: order.productCost,
      advertisingCost: order.advertisingCost,
      netRevenue: order.netRevenue,
      netMargin: order.netMargin,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod ?? '',
      currency: order.currency,
      status: order.paymentStatus as 'paid' | 'pending' | 'cancelled',
      products: order.products.map((p) => ({
        id: p.productId,
        name: p.name,
        sku: p.sku || '',
        quantity: p.quantity,
        price: p.price,
        cost: p.cost,
        total: p.total,
      })),
    }));

    return NextResponse.json({
      success: true,
      orders: sales,
      count: sales.length,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
