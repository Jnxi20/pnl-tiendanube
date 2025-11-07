import axios from 'axios';

/**
 * Test directo de la API sin OAuth
 * Para apps en desarrollo, a veces hay un access token de prueba
 */

async function testDirectAPI() {
  const [, , storeId, accessToken] = process.argv;

  if (!storeId || !accessToken) {
    console.log('\n❌ Falta Store ID o Access Token\n');
    console.log('Uso:');
    console.log('  npm run test-api -- <STORE_ID> <ACCESS_TOKEN>\n');
    console.log('Busca en el panel de Partners si hay un "Access Token de prueba"\n');
    process.exit(1);
  }

  console.log('\n🔄 Probando conexión directa a la API...\n');
  console.log(`Store ID:      ${storeId}`);
  console.log(`Access Token:  ${accessToken.substring(0, 20)}...\n`);

  try {
    const response = await axios.get(
      `https://api.tiendanube.com/v1/${storeId}/store`,
      {
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PNL-TiendaNube-App/1.0',
        },
      }
    );

    console.log('✅ ¡CONEXIÓN EXITOSA!\n');
    console.log('Información de la tienda:');
    console.log('─'.repeat(80));
    console.log(`Nombre:   ${response.data.name}`);
    console.log(`País:     ${response.data.country}`);
    console.log(`Moneda:   ${response.data.currency}`);
    console.log(`URL:      ${response.data.url}`);
    console.log('');

    console.log('✅ Las credenciales funcionan! Ahora ejecuta:');
    console.log(`npm run fetch-order -- ${storeId} ${accessToken}`);
    console.log('');

  } catch (error: any) {
    console.error('❌ Error al conectar con la API:\n');

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);

      if (error.response.status === 401) {
        console.error('\n⚠️  Access Token inválido o expirado\n');
      }
    } else {
      console.error(error.message);
    }

    process.exit(1);
  }
}

testDirectAPI();
