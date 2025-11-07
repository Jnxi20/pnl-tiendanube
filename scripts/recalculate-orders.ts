import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { transformOrderToSale } from '@/lib/api/transformer';
import type { TiendaNubeOrder } from '@/types/api';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Recalculando todas las órdenes con los nuevos porcentajes...\n');

  // Get all orders
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length === 0) {
    console.log('❌ No se encontraron órdenes en la base de datos.');
    return;
  }

  console.log(`📊 Encontradas ${orders.length} órdenes para recalcular\n`);

  let updated = 0;
  let errors = 0;

  for (const order of orders) {
    try {
      const rawData = order.rawData as TiendaNubeOrder | null;

      if (!rawData) {
        console.log(`⚠️  Orden #${order.orderNumber}: Sin rawData, saltando`);
        errors++;
        continue;
      }

      // Recalculate with new percentages
      const recalculated = transformOrderToSale(rawData, {
        tiendaNubeFeePercentage: 5.31, // Updated from 3%
        advertisingCost: order.advertisingCost,
      });

      // Update in database
      await prisma.order.update({
        where: { id: order.id },
        data: {
          tiendaNubeFee: recalculated.tiendaNubeFee,
          paymentFee: recalculated.paymentFee,
          shippingCost: recalculated.shippingCost,
          productCost: recalculated.productCost,
          netRevenue: recalculated.netRevenue,
          netMargin: recalculated.netMargin,
        },
      });

      const oldNet = order.netRevenue;
      const newNet = recalculated.netRevenue;
      const difference = newNet - oldNet;

      console.log(
        `✅ Orden #${order.orderNumber}: Neto ${oldNet.toFixed(2)} → ${newNet.toFixed(2)} (${difference >= 0 ? '+' : ''}${difference.toFixed(2)})`
      );

      updated++;
    } catch (error) {
      console.error(`❌ Error en orden #${order.orderNumber}:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✨ Recalculación completada:`);
  console.log(`   • ${updated} órdenes actualizadas`);
  console.log(`   • ${errors} errores`);
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
