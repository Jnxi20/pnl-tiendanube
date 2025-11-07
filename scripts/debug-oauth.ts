import 'dotenv/config';
import axios from 'axios';

/**
 * Script para debug del flujo OAuth
 */

const OAUTH_URL = 'https://www.tiendanube.com/apps/authorize/token';
const CLIENT_ID = process.env.TIENDANUBE_CLIENT_ID || '22728';
const CLIENT_SECRET = process.env.TIENDANUBE_CLIENT_SECRET || '0bb6feee8749e3e0cb0fb6ae5dcdf167292f24a068c75326';

async function debugOAuth() {
  const [, , code] = process.argv;

  if (!code) {
    console.log('\n❌ Error: Falta el código\n');
    console.log('Uso: npm run debug-oauth -- <CODE>\n');
    process.exit(1);
  }

  console.log('\n🔍 DEBUG OAuth Flow');
  console.log('─'.repeat(80));
  console.log(`Client ID:     ${CLIENT_ID}`);
  console.log(`Client Secret: ${CLIENT_SECRET.substring(0, 10)}...`);
  console.log(`Code:          ${code.substring(0, 20)}...`);
  console.log(`OAuth URL:     ${OAUTH_URL}`);
  console.log('');

  // Try with different request formats
  const attempts = [
    {
      name: 'Attempt 1: Standard OAuth',
      data: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
      },
      headers: {
        'Content-Type': 'application/json',
      }
    },
    {
      name: 'Attempt 2: With redirect_uri',
      data: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:3000/api/auth/callback',
      },
      headers: {
        'Content-Type': 'application/json',
      }
    },
    {
      name: 'Attempt 3: Form-encoded',
      data: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    },
  ];

  for (const attempt of attempts) {
    console.log(`\n🔄 ${attempt.name}`);
    console.log('─'.repeat(80));

    try {
      const response = await axios.post(OAUTH_URL, attempt.data, {
        headers: attempt.headers,
      });

      console.log('✅ SUCCESS!');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('');
      console.log(`Store ID:      ${response.data.user_id}`);
      console.log(`Access Token:  ${response.data.access_token}`);
      return;

    } catch (error: any) {
      if (error.response) {
        console.log(`❌ Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n❌ Todos los intentos fallaron.');
  console.log('\nPosibles causas:');
  console.log('  1. La Redirect URI en Partners no es: http://localhost:3000/api/auth/callback');
  console.log('  2. El Client Secret está incorrecto');
  console.log('  3. La app no tiene los permisos necesarios configurados');
  console.log('  4. El código expiró (intenta con uno nuevo)');
  console.log('');
  console.log('Verifica en https://partners.tiendanube.com/');
  console.log('');
}

debugOAuth();
