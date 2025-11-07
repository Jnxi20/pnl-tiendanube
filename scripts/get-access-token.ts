import 'dotenv/config';

/**
 * Script para obtener el Access Token de Tienda Nube
 *
 * Este script te da la URL para autorizar la app y luego puedes
 * intercambiar el código por un Access Token
 */

const CLIENT_ID = process.env.TIENDANUBE_CLIENT_ID || '22728';
const REDIRECT_URI = process.env.TIENDANUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

console.log('\n' + '═'.repeat(80));
console.log('🔐 OBTENER ACCESS TOKEN DE TIENDA NUBE');
console.log('═'.repeat(80) + '\n');

console.log('Para obtener tu Access Token, sigue estos pasos:\n');

console.log('PASO 1: Abre esta URL en tu navegador');
console.log('─'.repeat(80));
const authUrl = `https://www.tiendanube.com/apps/${CLIENT_ID}/authorize`;
console.log(authUrl);
console.log('');

console.log('PASO 2: Inicia sesión en tu tienda de Tienda Nube');
console.log('  • Se te pedirá autorizar la aplicación PNL Analytics');
console.log('  • Acepta los permisos solicitados\n');

console.log('PASO 3: Después de autorizar, serás redirigido a:');
console.log(`  ${REDIRECT_URI}?code=CODIGO_AQUI\n`);

console.log('PASO 4: Copia el valor del parámetro "code" de la URL\n');

console.log('PASO 5: Ejecuta el siguiente comando:');
console.log('─'.repeat(80));
console.log('npm run exchange-token -- <CODE_AQUI>');
console.log('');

console.log('Ejemplo:');
console.log('npm run exchange-token -- abc123def456ghi789\n');

console.log('═'.repeat(80) + '\n');
