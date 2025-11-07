import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { inspect } from 'util';
import { getOrderFinancialBreakdown } from '@/lib/api/transformer';
import type { TiendaNubeOrder } from '@/types/api';

const prisma = new PrismaClient();

function formatCurrency(value: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function printCommissionCandidates(payload: Record<string, unknown>) {
  const matches: Array<[string, unknown]> = [];

  const queue: Array<{ value: unknown; path: string[] }> = [
    { value: payload, path: [] },
  ];

  while (queue.length > 0) {
    const { value, path } = queue.shift()!;
    if (!value || typeof value !== 'object') {
      continue;
    }

    for (const [key, child] of Object.entries(value)) {
      const nextPath = [...path, key];
      if (/(commission|comision|fee|charge)/i.test(key)) {
        matches.push([nextPath.join('.'), child]);
      }
      queue.push({ value: child, path: nextPath });
    }
  }

  if (matches.length === 0) {
    console.log('  • No se hallaron keys relacionadas a comisiones en payload.extra/rawData');
    return;
  }

  console.log('  • Campos potenciales de comisiones en el payload:');
  matches.slice(0, 10).forEach(([pathKey, value]) => {
    console.log(`    - ${pathKey}: ${inspect(value, { depth: 2 })}`);
  });

  if (matches.length > 10) {
    console.log(`    … (${matches.length - 10} coincidencias adicionales)`);
  }
}

async function main() {
  const [, , idArg, limitArg] = process.argv;
  const orderId = idArg ? Number(idArg) : undefined;
  const limit = limitArg ? Number(limitArg) : 5;

  const orders = await prisma.order.findMany({
    where: orderId ? { tiendanubeId: orderId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: orderId ? 1 : limit,
  });

  if (orders.length === 0) {
    console.log('No se encontraron órdenes en la base de datos. Ejecutá un sync primero.');
    return;
  }

  for (const order of orders) {
    const rawPayload = order.rawData as TiendaNubeOrder | null;
    console.log('────────────────────────────────────────────────────');
    console.log(
      `Orden #${order.orderNumber} · TiendaNube ID ${order.tiendanubeId} · ${order.date.toISOString()}`
    );

    if (!rawPayload) {
      console.log('No hay rawData almacenado para esta orden.');
      continue;
    }

    const breakdown = getOrderFinancialBreakdown(rawPayload, {
      tiendaNubeFeePercentage: order.tiendaNubeFee
        ? (order.tiendaNubeFee / order.grossRevenue) * 100
        : undefined,
    });

    console.log(
      `Ingresos brutos: ${formatCurrency(breakdown.grossRevenue, order.currency)}`
    );
    console.log(
      `Subtotal declarado por API: ${formatCurrency(breakdown.subtotal, order.currency)}`
    );
    console.log(
      `Descuentos — total:${formatCurrency(
        breakdown.discounts.total,
        order.currency
      )}, cupón:${formatCurrency(breakdown.discounts.coupon, order.currency)}, gateway:${formatCurrency(
        breakdown.discounts.gateway,
        order.currency
      )}`
    );
    console.log(
      `Envíos — cliente:${formatCurrency(
        breakdown.shipping.customer,
        order.currency
      )}, tienda:${formatCurrency(
        breakdown.shipping.owner,
        order.currency
      )}, delta:${formatCurrency(breakdown.shipping.delta, order.currency)}`
    );
    console.log(
      `Costo productos (según payload): ${formatCurrency(
        breakdown.productCost,
        order.currency
      )}`
    );
    console.log(
      `Fee Tienda Nube detectado: ${formatCurrency(breakdown.tiendaNubeFee, order.currency)}`
    );
    console.log(
      `Fee Gateway detectado: ${formatCurrency(breakdown.paymentFee, order.currency)}`
    );

    if (breakdown.payments && breakdown.payments.length > 0) {
      console.log('Pagos reportados por la API:');
      breakdown.payments.forEach((payment) => {
        console.log(
          `  - ${payment.gateway.toUpperCase()} (${payment.method}) · status: ${
            payment.status
          } · monto transacción: ${formatCurrency(
            payment.transactionAmount,
            order.currency
          )} · neto acreditado: ${formatCurrency(
            payment.netAmount,
            order.currency
          )} · gateway_fee: ${formatCurrency(
            payment.gatewayFee,
            order.currency
          )} · installments_cost: ${formatCurrency(
            payment.installmentsCost,
            order.currency
          )}`
        );
      });
    } else {
      console.log('La orden no posee array de pagos en el payload.');
    }

    printCommissionCandidates(rawPayload as unknown as Record<string, unknown>);
  }
}

main()
  .catch((error) => {
    console.error('Error analizando órdenes:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
