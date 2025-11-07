import 'dotenv/config';
import axios from 'axios';

/**
 * Script para intercambiar el código de autorización por un Access Token
 *
 * Uso: npm run exchange-token -- <CODE>
 */

const OAUTH_URL = 'https://www.tiendanube.com/apps/authorize/token';
const CLIENT_ID = process.env.TIENDANUBE_CLIENT_ID || '22728';
const CLIENT_SECRET = process.env.TIENDANUBE_CLIENT_SECRET || '0bb6feee8749e3e0cb0fb6ae5dcdf167292f24a068c75326';

async function exchangeToken() {
  const [, , code] = process.argv;

  if (!code) {
    console.log('\n❌ Error: Falta el código de autorización\n');
    console.log('Uso:');
    console.log('  npm run exchange-token -- <CODE>\n');
    console.log('Ejemplo:');
    console.log('  npm run exchange-token -- abc123def456ghi789\n');
    console.log('Ejecuta "npm run get-token" para obtener el código primero.\n');
    process.exit(1);
  }

  try {
    console.log('\n🔄 Intercambiando código por Access Token...\n');

    const response = await axios.post(OAUTH_URL, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { access_token, user_id } = response.data;

    console.log('✅ ¡Access Token obtenido exitosamente!\n');
    console.log('═'.repeat(80));
    console.log('📋 TUS CREDENCIALES');
    console.log('═'.repeat(80) + '\n');

    console.log(`Store ID (user_id):  ${user_id}`);
    console.log(`Access Token:        ${access_token}`);
    console.log('');

    console.log('═'.repeat(80));
    console.log('📝 PRÓXIMOS PASOS');
    console.log('═'.repeat(80) + '\n');

    console.log('1. Actualiza tu archivo .env con estos valores:');
    console.log('─'.repeat(80));
    console.log(`TIENDANUBE_STORE_ID=${user_id}`);
    console.log(`TIENDANUBE_ACCESS_TOKEN=${access_token}`);
    console.log('');

    console.log('2. Ejecuta el script para traer tu última orden:');
    console.log('─'.repeat(80));
    console.log(`npm run fetch-order -- ${user_id} ${access_token}`);
    console.log('');

    console.log('O si prefieres actualizar el .env primero:');
    console.log('npm run fetch-order-env\n');

  } catch (error: any) {
    console.error('\n❌ Error al obtener el Access Token:\n');

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);

      if (error.response.status === 400) {
        console.error('\n⚠️  El código puede ser inválido o ya fue usado.');
        console.error('   Ejecuta "npm run get-token" para obtener uno nuevo.\n');
      }
    } else {
      console.error(error.message);
    }

    process.exit(1);
  }
}

exchangeToken();
