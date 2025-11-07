import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: 197 },
    include: { products: true },
  });

  if (!order) {
    console.log('Orden #197 no encontrada');
    return;
  }

  const rawData = order.rawData as any;

  console.log('=== ANÁLISIS DE SHIPPING ===');
  console.log('shipping field:', rawData.shipping);
  console.log('shipping_cost_owner:', rawData.shipping_cost_owner);
  console.log('shipping_cost_customer:', rawData.shipping_cost_customer);
  console.log('shipping_cost_store:', rawData.shipping_cost_store);
  console.log('');
  console.log('=== ANÁLISIS DE PRODUCTOS ===');
  console.log('Productos en la orden:', order.products.length);
  order.products.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     Cantidad: ${p.quantity}, Precio: $${p.price}, Costo: $${p.cost}`);
    console.log(`     Total: $${p.total}`);
  });
  console.log('');
  console.log('Total Product Cost en DB:', order.productCost);
  console.log('');
  console.log('=== PRODUCTOS EN RAW DATA ===');
  rawData.products?.forEach((p: any, i: number) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     Cantidad: ${p.quantity}, Precio: ${p.price}, Costo: ${p.cost || 'N/A'}`);
  });
}

main().finally(() => prisma.$disconnect());
