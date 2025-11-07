import axios from 'axios';

/**
 * Script para traer la última orden directamente de la API de Tienda Nube
 *
 * Uso:
 * npm run fetch-order -- <STORE_ID> <ACCESS_TOKEN>
 *
 * Ejemplo:
 * npm run fetch-order -- 1234567 abc123xyz456token789
 */

const BASE_URL = 'https://api.tiendanube.com/v1';

function formatCurrency(value: any, currency = 'ARS') {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

async function fetchLastOrder() {
  const [, , storeId, accessToken] = process.argv;

  if (!storeId || !accessToken) {
    console.log('\n❌ Error: Faltan parámetros\n');
    console.log('Uso:');
    console.log('  npm run fetch-order -- <STORE_ID> <ACCESS_TOKEN>\n');
    console.log('Ejemplo:');
    console.log('  npm run fetch-order -- 1234567 abc123xyz456token789\n');
    console.log('Para obtener tus credenciales:');
    console.log('  1. Ve a https://www.tiendanube.com/apps');
    console.log('  2. Crea una app o usa una existente');
    console.log('  3. Instala la app en tu tienda');
    console.log('  4. Obtén el Access Token\n');
    process.exit(1);
  }

  try {
    console.log('\n🔄 Consultando API de Tienda Nube...\n');
    console.log(`Store ID: ${storeId}`);
    console.log(`Token: ${accessToken.substring(0, 10)}...`);

    // Fetch last order
    const response = await axios.get(
      `${BASE_URL}/${storeId}/orders`,
      {
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PNL-TiendaNube-App/1.0',
        },
        params: {
          per_page: 1,
          page: 1,
        },
      }
    );

    const orders = response.data;

    if (!orders || orders.length === 0) {
      console.log('❌ No se encontraron órdenes en tu tienda.');
      console.log('   Crea una orden de prueba en Tienda Nube y vuelve a intentar.\n');
      return;
    }

    const order = orders[0];

    console.log('\n' + '═'.repeat(80));
    console.log('✅ ÚLTIMA ORDEN RECIBIDA - DATOS DE LA API');
    console.log('═'.repeat(80) + '\n');

    // Información básica
    console.log('📦 INFORMACIÓN BÁSICA');
    console.log('─'.repeat(80));
    console.log(`Número de orden:       #${order.number}`);
    console.log(`ID Tienda Nube:        ${order.id}`);
    console.log(`Fecha creación:        ${order.created_at}`);
    console.log(`Estado orden:          ${order.status}`);
    console.log(`Estado pago:           ${order.payment_status}`);
    console.log(`Cliente:               ${order.customer?.name || 'N/A'}`);
    console.log(`Email:                 ${order.customer?.email || 'N/A'}`);

    // Montos principales
    console.log('\n💰 MONTOS PRINCIPALES');
    console.log('─'.repeat(80));
    console.log(`Total:                 ${formatCurrency(order.total, order.currency)}`);
    console.log(`Subtotal:              ${formatCurrency(order.subtotal, order.currency)}`);
    console.log(`Moneda:                ${order.currency}`);

    // Descuentos
    console.log('\n🎫 DESCUENTOS');
    console.log('─'.repeat(80));
    console.log(`Descuento total:       ${formatCurrency(order.discount, order.currency)}`);
    console.log(`Descuento cupón:       ${formatCurrency(order.discount_coupon || 0, order.currency)}`);
    console.log(`Descuento gateway:     ${formatCurrency(order.discount_gateway || 0, order.currency)}`);

    // Envío
    console.log('\n🚚 ENVÍO');
    console.log('─'.repeat(80));
    console.log(`Método de envío:       ${order.shipping_option || 'N/A'}`);
    console.log(`Shipping (general):    ${formatCurrency(order.shipping, order.currency)}`);
    console.log(`Cobrado al cliente:    ${formatCurrency(order.shipping_cost_customer || 0, order.currency)}`);
    console.log(`Costo real (owner):    ${formatCurrency(order.shipping_cost_owner || 0, order.currency)}`);
    console.log(`Costo tienda (store):  ${formatCurrency(order.shipping_cost_store || 0, order.currency)}`);

    // Pago
    console.log('\n💳 MÉTODO DE PAGO');
    console.log('─'.repeat(80));
    console.log(`Gateway:               ${order.gateway}`);
    console.log(`Nombre gateway:        ${order.gateway_name || 'N/A'}`);

    // Detalles de pagos
    if (order.payments && order.payments.length > 0) {
      console.log('\n💵 DETALLES DE PAGOS (ARRAY)');
      console.log('─'.repeat(80));
      console.log(`Total de pagos:        ${order.payments.length}`);

      order.payments.forEach((payment: any, idx: number) => {
        console.log(`\n  Pago #${idx + 1}:`);
        console.log(`    Gateway:                 ${payment.gateway}`);
        console.log(`    Método:                  ${payment.payment_method}`);
        console.log(`    Estado:                  ${payment.status}`);
        console.log(`    Cuotas:                  ${payment.installments || 1}`);
        console.log(`    Monto transacción:       ${formatCurrency(payment.transaction_amount || 0, order.currency)}`);
        console.log(`    Neto acreditado:         ${formatCurrency(payment.net_amount || 0, order.currency)}`);
        console.log(`    Gateway fee:             ${formatCurrency(payment.gateway_fee || 0, order.currency)}`);
        console.log(`    Costo cuotas s/interés:  ${formatCurrency(payment.installments_cost || 0, order.currency)}`);
      });
    } else {
      console.log('\n⚠️  No hay array de payments[] en esta orden');
    }

    // Productos
    console.log('\n📦 PRODUCTOS');
    console.log('─'.repeat(80));
    console.log(`Total productos:       ${order.products?.length || 0}`);

    if (order.products && order.products.length > 0) {
      let totalProductValue = 0;
      let totalProductCost = 0;

      order.products.forEach((product: any, idx: number) => {
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        const cost = typeof product.cost === 'string' ? parseFloat(product.cost) : (product.cost || 0);
        const subtotal = price * product.quantity;
        const costTotal = cost * product.quantity;

        totalProductValue += subtotal;
        totalProductCost += costTotal;

        console.log(`\n  Producto #${idx + 1}:`);
        console.log(`    Nombre:        ${product.name}`);
        console.log(`    SKU:           ${product.sku || 'N/A'}`);
        console.log(`    Cantidad:      ${product.quantity}`);
        console.log(`    Precio unit:   ${formatCurrency(price, order.currency)}`);
        console.log(`    Costo unit:    ${formatCurrency(cost, order.currency)}`);
        console.log(`    Subtotal:      ${formatCurrency(subtotal, order.currency)}`);
        console.log(`    Costo total:   ${formatCurrency(costTotal, order.currency)}`);
      });

      console.log('\n  TOTAL PRODUCTOS:');
      console.log(`    Valor total:   ${formatCurrency(totalProductValue, order.currency)}`);
      console.log(`    Costo total:   ${formatCurrency(totalProductCost, order.currency)}`);
    }

    // Datos crudos JSON
    console.log('\n📄 DATOS CRUDOS (JSON)');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(order, null, 2));

    console.log('\n' + '═'.repeat(80));
    console.log('✨ FIN DE LA CONSULTA');
    console.log('═'.repeat(80) + '\n');

    console.log('💡 Ahora puedes verificar estos datos contra lo que ves en Tienda Nube\n');

  } catch (error: any) {
    console.error('\n❌ Error al consultar la API:\n');

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Mensaje: ${JSON.stringify(error.response.data, null, 2)}`);

      if (error.response.status === 401) {
        console.error('\n⚠️  Error de autenticación. Verifica que:');
        console.error('   1. El Access Token sea válido');
        console.error('   2. El Store ID sea correcto');
        console.error('   3. La app tenga permisos para leer órdenes\n');
      }
    } else {
      console.error(error.message);
    }

    process.exit(1);
  }
}

fetchLastOrder();
