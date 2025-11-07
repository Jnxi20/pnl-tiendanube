import { NextResponse } from 'next/server';
import { getCurrentUser, getAccessToken } from '@/lib/auth/session';

/**
 * Test endpoint to check if we can access Fulfillment Orders and Transactions
 * GET /api/test-enhanced-data?orderId=1818321105
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.storeId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || '1818321105'; // Order #197

    const baseUrl = `https://api.tiendanube.com/v1/${user.storeId}`;
    const headers = {
      'Authentication': `bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PNL Analytics (contact@example.com)',
    };

    console.log(`Testing enhanced data for order ${orderId}...`);

    const results: any = {
      orderId,
      storeId: user.storeId,
      tests: {},
    };

    // Test 1: Fulfillment Orders
    try {
      console.log(`Fetching fulfillment orders...`);
      const fulfillmentRes = await fetch(
        `${baseUrl}/orders/${orderId}/fulfillment-orders`,
        { headers }
      );

      results.tests.fulfillmentOrders = {
        status: fulfillmentRes.status,
        statusText: fulfillmentRes.statusText,
      };

      if (fulfillmentRes.ok) {
        const fulfillmentData = await fulfillmentRes.json();
        results.tests.fulfillmentOrders.data = fulfillmentData;
        results.tests.fulfillmentOrders.success = true;

        // Extract shipping costs
        if (Array.isArray(fulfillmentData) && fulfillmentData.length > 0) {
          const shipping = fulfillmentData[0].shipping;
          results.shippingCosts = {
            merchantCost: shipping?.merchant_cost,
            consumerCost: shipping?.consumer_cost,
          };
        }
      } else {
        const errorText = await fulfillmentRes.text();
        results.tests.fulfillmentOrders.error = errorText;
        results.tests.fulfillmentOrders.success = false;
      }
    } catch (error) {
      results.tests.fulfillmentOrders = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 2: Transactions
    try {
      console.log(`Fetching transactions...`);
      const transactionRes = await fetch(
        `${baseUrl}/orders/${orderId}/transactions`,
        { headers }
      );

      results.tests.transactions = {
        status: transactionRes.status,
        statusText: transactionRes.statusText,
      };

      if (transactionRes.ok) {
        const transactionData = await transactionRes.json();
        results.tests.transactions.data = transactionData;
        results.tests.transactions.success = true;

        // Extract fees
        if (Array.isArray(transactionData) && transactionData.length > 0) {
          const transaction = transactionData[0];
          results.paymentFees = {
            merchantCharges: transaction.info?.merchant_charges,
            consumerCharges: transaction.info?.consumer_charges,
            financingCost: transaction.info?.merchant_charges?.find(
              (c: any) => c.type === 'financing_cost'
            ),
            paymentProcessingFee: transaction.info?.merchant_charges?.find(
              (c: any) => c.type === 'payment_processing_fee'
            ),
          };
        }
      } else {
        const errorText = await transactionRes.text();
        results.tests.transactions.error = errorText;
        results.tests.transactions.success = false;
      }
    } catch (error) {
      results.tests.transactions = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
