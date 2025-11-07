import 'dotenv/config';

/**
 * Script simple para consultar la DB de Vercel usando fetch
 * Sin necesidad de Prisma
 */

async function queryDB() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log('\n❌ No se encontró DATABASE_URL en .env\n');
    process.exit(1);
  }

  console.log('\n🔍 Consultando base de datos de Vercel...\n');
  console.log(`Connection string: ${dbUrl.substring(0, 50)}...\n`);

  try {
    // Parsear la URL de conexión
    const url = new URL(dbUrl.replace('postgres://', 'http://'));
    const [username, password] = url.username ? [url.username, url.password] : ['', ''];
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1).split('?')[0];

    console.log(`Host:     ${host}`);
    console.log(`Port:     ${port}`);
    console.log(`Database: ${database}`);
    console.log(`User:     ${username}`);
    console.log('');

    console.log('⚠️  Este script requiere el paquete "pg" o acceso directo a Postgres.');
    console.log('Como alternativa, puedes:');
    console.log('');
    console.log('1. Usar Vercel CLI:');
    console.log('   vercel env pull .env.local');
    console.log('   npx prisma studio');
    console.log('');
    console.log('2. Consultar desde Vercel Dashboard:');
    console.log('   https://vercel.com/dashboard → Storage → Postgres → Data');
    console.log('   Busca en la tabla "Account" si hay algún access_token');
    console.log('');
    console.log('3. O dame el Store ID de tu tienda y puedo ayudarte');
    console.log('   a obtener un nuevo Access Token correctamente.');
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

queryDB();
