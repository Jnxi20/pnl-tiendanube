import 'dotenv/config';

/**
 * Script para obtener Access Token usando Store ID específico
 */

const CLIENT_ID = process.env.TIENDANUBE_CLIENT_ID || '22728';
const STORE_ID = '6567205';

console.log('\n' + '═'.repeat(80));
console.log('🔐 OBTENER ACCESS TOKEN - MÉTODO CORRECTO');
console.log('═'.repeat(80) + '\n');

console.log('Tu Store ID: ' + STORE_ID + '\n');

console.log('IMPORTANTE: Para que el OAuth funcione, necesitas:');
console.log('1. Asegurarte que la app esté PUBLICADA o en modo TESTING');
console.log('2. Que la Redirect URI sea EXACTAMENTE: http://localhost:3000/api/auth/callback\n');

console.log('PASO 1: Abre esta URL en tu navegador');
console.log('─'.repeat(80));
const authUrl = `https://www.tiendanube.com/apps/${CLIENT_ID}/authorize?state=${STORE_ID}`;
console.log(authUrl);
console.log('');

console.log('PASO 2: Autoriza la aplicación');
console.log('  • Inicia sesión con tu cuenta de Tienda Nube');
console.log('  • Acepta los permisos\n');

console.log('PASO 3: Serás redirigido a una URL como:');
console.log('  http://localhost:3000/api/auth/callback?code=XXXXXXXX&state=' + STORE_ID);
console.log('');

console.log('PASO 4: Copia SOLO el código (la parte después de code=)');
console.log('');

console.log('PASO 5: Ejecuta inmediatamente (antes de que expire):');
console.log('─'.repeat(80));
console.log('npm run exchange-token -- <CODIGO>');
console.log('');

console.log('Si sigue fallando con error 403, es probable que:');
console.log('  • La app no esté correctamente configurada en Partners');
console.log('  • La Redirect URI no coincida exactamente');
console.log('  • La app necesite estar en modo "Testing" o "Published"\n');

console.log('ALTERNATIVA: Si tienes acceso a la app instalada en tu tienda:');
console.log('  • Ve a tu tienda → Configuración → Aplicaciones');
console.log('  • Busca si la app ya está instalada');
console.log('  • Puede haber un Access Token visible ahí\n');

console.log('═'.repeat(80) + '\n');
