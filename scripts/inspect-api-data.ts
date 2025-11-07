import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import type { TiendaNubeOrder } from '@/types/api';

const prisma = new PrismaClient();

function formatCurrency(value: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

async function main() {
  const [, , orderNumberArg] = process.argv;
  const orderNumber = orderNumberArg ? Number(orderNumberArg) : undefined;

  const orders = await prisma.order.findMany({
    where: orderNumber ? { orderNumber } : undefined,
    orderBy: { createdAt: 'desc' },
    take: orderNumber ? 1 : 3,
    include: {
      products: true,
    },
  });

  if (orders.length === 0) {
    console.log('❌ No se encontraron órdenes en la base de datos.');
    console.log('   Ejecuta primero un sync: POST /api/orders/sync');
    return;
  }

  console.log('\n' + '═'.repeat(80));
  console.log('📊 ANÁLISIS DE DATOS DE LA API DE TIENDA NUBE');
  console.log('═'.repeat(80) + '\n');

  for (const order of orders) {
    const rawData = order.rawData as TiendaNubeOrder | null;

    if (!rawData) {
      console.log(`⚠️  Orden #${order.orderNumber}: Sin rawData`);
      continue;
    }

    console.log('─'.repeat(80));
    console.log(`📦 ORDEN #${order.orderNumber} (Tienda Nube ID: ${order.tiendanubeId})`);
    console.log(`   Fecha: ${order.date.toISOString()}`);
    console.log(`   Cliente: ${order.customerName}`);
    console.log(`   Estado: ${rawData.status} / ${rawData.payment_status}`);
    console.log('─'.repeat(80));

    // 1. INGRESOS
    console.log('\n💰 1. INGRESOS (lo que ve el cliente)');
    const total = toNumber(rawData.total);
    const subtotal = toNumber(rawData.subtotal);
    const shippingCustomer = toNumber(rawData.shipping_cost_customer) || toNumber(rawData.shipping);

    console.log(`   Total facturado:              ${formatCurrency(total, order.currency)}`);
    console.log(`   Subtotal productos:           ${formatCurrency(subtotal, order.currency)}`);
    console.log(`   Envío cobrado al cliente:     ${formatCurrency(shippingCustomer, order.currency)}`);
    console.log(`   ✓ Verificación: subtotal + shipping = ${formatCurrency(subtotal + shippingCustomer, order.currency)}`);

    if (Math.abs((subtotal + shippingCustomer) - total) > 1) {
      console.log(`   ⚠️  DIFERENCIA detectada: ${formatCurrency(total - (subtotal + shippingCustomer), order.currency)}`);
    }

    // 2. DESCUENTOS
    console.log('\n🎫 2. DESCUENTOS (reducen lo cobrado)');
    const discountTotal = toNumber(rawData.discount);
    const discountCoupon = toNumber(rawData.discount_coupon);
    const discountGateway = toNumber(rawData.discount_gateway);

    console.log(`   Descuento total:              ${formatCurrency(discountTotal, order.currency)}`);
    console.log(`   • Cupón/promo:                ${formatCurrency(discountCoupon, order.currency)}`);
    console.log(`   • Gateway (ej: transferencia):${formatCurrency(discountGateway, order.currency)}`);

    const netRevenue = total - discountTotal;
    console.log(`   ✓ Ingreso neto inicial:       ${formatCurrency(netRevenue, order.currency)}`);

    // 3. PAGOS (FEES Y COSTOS FINANCIEROS)
    console.log('\n💳 3. DATOS DE PAGOS (fees del gateway)');
    console.log(`   Gateway principal: ${rawData.gateway} (${rawData.gateway_name})`);

    if (rawData.payments && rawData.payments.length > 0) {
      console.log(`   Pagos registrados: ${rawData.payments.length}`);

      rawData.payments.forEach((payment, idx) => {
        console.log(`\n   Pago #${idx + 1}:`);
        console.log(`     • Gateway: ${payment.gateway}`);
        console.log(`     • Método: ${payment.payment_method}`);
        console.log(`     • Estado: ${payment.status}`);
        console.log(`     • Cuotas: ${payment.installments || 1}`);

        const transactionAmount = toNumber(payment.transaction_amount);
        const netAmount = toNumber(payment.net_amount);
        const gatewayFee = toNumber(payment.gateway_fee);
        const installmentsCost = toNumber(payment.installments_cost);

        console.log(`     • Monto transacción:      ${formatCurrency(transactionAmount, order.currency)}`);
        console.log(`     • Neto acreditado:        ${formatCurrency(netAmount, order.currency)}`);
        console.log(`     • Gateway fee:            ${formatCurrency(gatewayFee, order.currency)}`);
        console.log(`     • Costo cuotas s/interés: ${formatCurrency(installmentsCost, order.currency)}`);

        const totalFees = gatewayFee + installmentsCost;
        const calculatedNet = transactionAmount - totalFees;

        console.log(`     ✓ Total fees:             ${formatCurrency(totalFees, order.currency)}`);
        console.log(`     ✓ Neto calculado:         ${formatCurrency(calculatedNet, order.currency)}`);

        if (netAmount > 0 && Math.abs(calculatedNet - netAmount) > 1) {
          console.log(`     ⚠️  DIFERENCIA: ${formatCurrency(calculatedNet - netAmount, order.currency)}`);
        }
      });
    } else {
      console.log(`   ⚠️  No hay array de payments[] en la API`);
      console.log(`   Se debe calcular fees manualmente usando porcentajes`);
    }

    // 4. ENVÍO (COSTO REAL)
    console.log('\n🚚 4. COSTOS DE ENVÍO');
    const shippingOwner = toNumber(rawData.shipping_cost_owner);
    const shippingStore = toNumber(rawData.shipping_cost_store);

    console.log(`   Envío cobrado al cliente:     ${formatCurrency(shippingCustomer, order.currency)}`);
    console.log(`   Costo real pagado (owner):    ${formatCurrency(shippingOwner, order.currency)}`);
    console.log(`   Costo en tienda (store):      ${formatCurrency(shippingStore, order.currency)}`);

    const shippingProfit = shippingCustomer - shippingOwner;
    if (shippingProfit > 0) {
      console.log(`   ✓ Ganancia en envío:          ${formatCurrency(shippingProfit, order.currency)}`);
    } else if (shippingProfit < 0) {
      console.log(`   ⚠️  Pérdida en envío:          ${formatCurrency(Math.abs(shippingProfit), order.currency)}`);
    }

    // 5. PRODUCTOS Y COSTOS
    console.log('\n📦 5. PRODUCTOS Y COSTOS');
    console.log(`   Productos en la orden: ${rawData.products.length}`);

    let totalProductRevenue = 0;
    let totalProductCost = 0;

    rawData.products.forEach((product, idx) => {
      const price = toNumber(product.price);
      const cost = toNumber(product.cost);
      const quantity = product.quantity;
      const subtotal = price * quantity;
      const costTotal = cost * quantity;

      totalProductRevenue += subtotal;
      totalProductCost += costTotal;

      console.log(`\n   Producto #${idx + 1}: ${product.name}`);
      console.log(`     • SKU: ${product.sku || 'N/A'}`);
      console.log(`     • Cantidad: ${quantity}`);
      console.log(`     • Precio unitario: ${formatCurrency(price, order.currency)}`);
      console.log(`     • Costo unitario:  ${formatCurrency(cost, order.currency)}`);
      console.log(`     • Subtotal:        ${formatCurrency(subtotal, order.currency)}`);
      console.log(`     • Costo total:     ${formatCurrency(costTotal, order.currency)}`);

      const productMargin = subtotal > 0 ? ((subtotal - costTotal) / subtotal) * 100 : 0;
      console.log(`     • Margen:          ${productMargin.toFixed(2)}%`);
    });

    console.log(`\n   ✓ Total revenue productos:    ${formatCurrency(totalProductRevenue, order.currency)}`);
    console.log(`   ✓ Total costo productos:      ${formatCurrency(totalProductCost, order.currency)}`);

    // 6. RESUMEN GUARDADO EN DB
    console.log('\n💾 6. CÁLCULOS GUARDADOS EN LA BASE DE DATOS');
    console.log(`   Gross Revenue (guardado):     ${formatCurrency(order.grossRevenue, order.currency)}`);
    console.log(`   Tienda Nube Fee (guardado):   ${formatCurrency(order.tiendaNubeFee, order.currency)}`);
    console.log(`   Payment Fee (guardado):       ${formatCurrency(order.paymentFee, order.currency)}`);
    console.log(`   Shipping Cost (guardado):     ${formatCurrency(order.shippingCost, order.currency)}`);
    console.log(`   Product Cost (guardado):      ${formatCurrency(order.productCost, order.currency)}`);
    console.log(`   Net Revenue (guardado):       ${formatCurrency(order.netRevenue, order.currency)}`);
    console.log(`   Net Margin (guardado):        ${order.netMargin.toFixed(2)}%`);

    // 7. ANÁLISIS Y PROBLEMAS
    console.log('\n🔍 7. ANÁLISIS DE PRECISIÓN');

    // Verificar Tienda Nube Fee
    const expectedTNFee = subtotal * 0.0531; // 5.31% sobre subtotal
    const tnFeeDiff = Math.abs(order.tiendaNubeFee - expectedTNFee);

    console.log(`\n   Tienda Nube Fee (5.31%):`);
    console.log(`     • Base de cálculo (debe ser subtotal): ${formatCurrency(subtotal, order.currency)}`);
    console.log(`     • Fee esperado (5.31%):                ${formatCurrency(expectedTNFee, order.currency)}`);
    console.log(`     • Fee guardado en DB:                  ${formatCurrency(order.tiendaNubeFee, order.currency)}`);

    if (tnFeeDiff > 1) {
      const wrongBase = order.grossRevenue;
      const wrongFee = wrongBase * 0.0531;
      if (Math.abs(order.tiendaNubeFee - wrongFee) < 1) {
        console.log(`     ❌ ERROR: Se calculó sobre TOTAL ($${wrongBase.toFixed(2)}) en vez de SUBTOTAL`);
        console.log(`     💡 Diferencia: ${formatCurrency(tnFeeDiff, order.currency)}`);
      }
    } else {
      console.log(`     ✅ CORRECTO`);
    }

    // Verificar Product Cost
    const productCostDiff = Math.abs(order.productCost - totalProductCost);
    console.log(`\n   Product Cost:`);
    console.log(`     • Calculado de productos API: ${formatCurrency(totalProductCost, order.currency)}`);
    console.log(`     • Guardado en DB:             ${formatCurrency(order.productCost, order.currency)}`);
    console.log(`     ${productCostDiff < 1 ? '✅ CORRECTO' : '❌ DIFERENCIA: ' + formatCurrency(productCostDiff, order.currency)}`);

    // Verificar Shipping Cost
    console.log(`\n   Shipping Cost:`);
    console.log(`     • Costo real (owner):         ${formatCurrency(shippingOwner, order.currency)}`);
    console.log(`     • Guardado en DB:             ${formatCurrency(order.shippingCost, order.currency)}`);
    console.log(`     ${Math.abs(order.shippingCost - shippingOwner) < 1 ? '✅ CORRECTO' : '⚠️  DIFERENCIA'}`);

    console.log('\n' + '─'.repeat(80) + '\n');
  }

  console.log('═'.repeat(80));
  console.log('✨ FIN DEL ANÁLISIS');
  console.log('═'.repeat(80) + '\n');

  console.log('💡 Cómo usar este script:');
  console.log('   • Ver las últimas 3 órdenes:       npm run ts-node scripts/inspect-api-data.ts');
  console.log('   • Ver una orden específica:        npm run ts-node scripts/inspect-api-data.ts <número_orden>');
  console.log('   • Ejemplo:                         npm run ts-node scripts/inspect-api-data.ts 197\n');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
