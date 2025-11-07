import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Script para buscar Access Token en la base de datos de Vercel
 */

async function findToken() {
  const prisma = new PrismaClient();

  try {
    console.log('\n🔍 Buscando Access Token en la base de datos...\n');

    // Buscar usuarios
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
      },
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos.');
      console.log('   La app nunca fue autorizada o la DB está vacía.\n');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuario(s):\n`);

    for (const user of users) {
      console.log('─'.repeat(80));
      console.log(`Usuario: ${user.name || 'Sin nombre'}`);
      console.log(`Email:   ${user.email || 'Sin email'}`);
      console.log(`Store ID: ${user.storeId || 'No configurado'}`);
      console.log(`Cuentas conectadas: ${user.accounts.length}`);

      if (user.accounts.length > 0) {
        user.accounts.forEach((account, idx) => {
          console.log(`\n  Cuenta #${idx + 1}:`);
          console.log(`    Provider: ${account.provider}`);
          console.log(`    Type: ${account.type}`);

          if (account.access_token) {
            console.log(`    ✅ Access Token: ${account.access_token.substring(0, 30)}...`);
            console.log('\n═'.repeat(80));
            console.log('🎉 ENCONTRADO! Usa estos valores:\n');
            console.log(`Store ID:      ${user.storeId}`);
            console.log(`Access Token:  ${account.access_token}`);
            console.log('\nEjecuta:');
            console.log(`npm run fetch-order -- ${user.storeId} ${account.access_token}`);
            console.log('═'.repeat(80) + '\n');
          } else {
            console.log(`    ⚠️  No tiene access_token guardado`);
          }
        });
      } else {
        console.log('  ⚠️  No hay cuentas conectadas (OAuth no completado)');
      }
      console.log('─'.repeat(80) + '\n');
    }

  } catch (error: any) {
    console.error('\n❌ Error al consultar la base de datos:\n');

    if (error.code === 'P1001') {
      console.error('No se pudo conectar a la base de datos.');
      console.error('Verifica que DATABASE_URL en .env sea correcto.\n');
    } else if (error.message.includes('prepared statement')) {
      console.error('Error de prepared statement. Esto puede pasar con Prisma Accelerate.');
      console.error('Intenta con: DATABASE_URL con ?pgbouncer=true al final\n');
    } else {
      console.error(error.message);
      console.error('\nAsegúrate de haber ejecutado: npx prisma generate\n');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

findToken();
