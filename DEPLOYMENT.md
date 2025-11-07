# Guía de Deployment - PNL TiendaNube

## 🗄️ Paso 1: Crear Base de Datos en Vercel

### Opción A: Dashboard de Vercel (Recomendado)

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto o crea uno nuevo:
   - Click en "Add New" → "Project"
   - Importa este repositorio desde GitHub
3. Ve a la pestaña **"Storage"**
4. Click en **"Create Database"**
5. Selecciona **"Postgres"**
6. Configura:
   - **Database Name:** `pnl-tiendanube-db`
   - **Region:** Selecciona la más cercana (ej: US East)
7. Click en **"Create"**

### Copiar Connection String

Una vez creada la base de datos:

1. En la página de la base de datos, ve a **".env.local"** tab
2. Copia el valor de `POSTGRES_URL`
3. Debe verse así:
   ```
   postgres://default:AbCdEf123@ep-cool-name-123456-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb
   ```

4. **IMPORTANTE:** Pega este valor en `.env.local` reemplazando la línea de `DATABASE_URL`

---

## 🔧 Paso 2: Configurar Variables de Entorno Localmente

Tu archivo `.env.local` ya está configurado con:

✅ **TIENDANUBE_CLIENT_ID:** 22728
✅ **TIENDANUBE_CLIENT_SECRET:** (configurado)
✅ **NEXTAUTH_SECRET:** (generado automáticamente)
✅ **ENCRYPTION_KEY:** (generado automáticamente)

**Solo falta:**
- ❌ **DATABASE_URL** → Copiarlo desde Vercel Postgres (Paso 1)

---

## 🗃️ Paso 3: Ejecutar Migraciones de Prisma

Una vez que tengas el `DATABASE_URL` en `.env.local`:

```bash
# Genera el cliente de Prisma
npx prisma generate

# Ejecuta las migraciones (crea las tablas en la base de datos)
npx prisma migrate dev --name init

# Verifica que las tablas se crearon correctamente
npx prisma studio
```

**`prisma studio`** abrirá una interfaz web donde puedes ver las tablas creadas.

---

## 🚀 Paso 4: Probar Localmente

```bash
# Inicia el servidor de desarrollo
npm run dev
```

Abre http://localhost:3000

### Flujo de Prueba:

1. Deberías ser redirigido a `/login`
2. Click en "Conectar con Tienda Nube"
3. Autoriza la aplicación en Tienda Nube
4. Serás redirigido a `/onboarding`
5. La app sincronizará tus órdenes automáticamente
6. Finalmente llegarás al dashboard con datos reales

---

## 🌐 Paso 5: Configurar Variables de Entorno en Vercel (Producción)

Cuando quieras deployar a producción:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las siguientes variables:

```
TIENDANUBE_CLIENT_ID=22728
TIENDANUBE_CLIENT_SECRET=0bb6feee8749e3e0cb0fb6ae5dcdf167292f24a068c75326
TIENDANUBE_REDIRECT_URI=https://tu-dominio.vercel.app/api/auth/callback
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=OXovjTsjZnos/8uPJPgnTRa9DY3Gkk9gmv3Ppr+AAGs=
NEXTAUTH_URL=https://tu-dominio.vercel.app
ENCRYPTION_KEY=4446eb065cb5dc789c8926b3d5b22a50c7e339af2ad17f0f0a4269044e048d1f
RATE_LIMIT_PER_SECOND=2
RATE_LIMIT_PER_HOUR=5000
```

**DATABASE_URL** se configurará automáticamente al vincular la base de datos de Vercel al proyecto.

---

## 🔗 Paso 6: Actualizar Redirect URI en Tienda Nube

Para producción, debes agregar tu URL de Vercel:

1. Ve a https://www.tiendanube.com/apps
2. Selecciona tu aplicación
3. En **"OAuth Redirect URIs"**, agrega:
   ```
   https://tu-dominio.vercel.app/api/auth/callback
   ```

---

## ✅ Checklist de Deployment

### Desarrollo Local:
- [x] Credenciales de Tienda Nube configuradas
- [ ] Base de datos Vercel Postgres creada
- [ ] DATABASE_URL copiado a `.env.local`
- [ ] Migraciones ejecutadas (`npx prisma migrate dev`)
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Login con Tienda Nube funcional

### Producción:
- [ ] Variables de entorno configuradas en Vercel
- [ ] Database vinculada al proyecto
- [ ] Redirect URI actualizado en Tienda Nube
- [ ] Deploy realizado
- [ ] Webhooks registrados automáticamente

---

## 🆘 Troubleshooting

### Error: "Prisma Client could not connect to database"

**Solución:** Verifica que DATABASE_URL esté correctamente configurado en `.env.local`

```bash
echo $DATABASE_URL  # Debe mostrar la connection string
```

### Error: "Invalid state" durante OAuth

**Solución:** Las cookies no se están guardando. Verifica que:
- Estés usando `http://localhost:3000` (no `127.0.0.1`)
- Las cookies estén habilitadas en tu navegador

### Error: "Rate limit exceeded"

**Solución:** Tienda Nube tiene límite de 2 requests/segundo. La app ya maneja esto automáticamente, pero si sincronizas muchas órdenes puede tardar.

### Webhooks no funcionan en desarrollo local

**Solución:** Los webhooks solo funcionan en producción con HTTPS. Para desarrollo local:
1. Usa ngrok: `ngrok http 3000`
2. Actualiza la URL del webhook en Tienda Nube con la URL de ngrok
3. O simplemente usa sincronización manual durante desarrollo

---

## 📊 Estructura de Base de Datos

Las tablas creadas por Prisma:

- **User** - Usuarios (stores conectadas)
- **Account** - Cuentas OAuth (tokens encriptados)
- **Session** - Sesiones de NextAuth
- **Order** - Órdenes sincronizadas
- **OrderProduct** - Productos dentro de órdenes
- **Settings** - Configuración por usuario
- **Webhook** - Log de webhooks recibidos
- **SyncLog** - Historial de sincronizaciones

---

## 🎯 Próximos Pasos

Una vez que todo funcione:

1. **Personalizar Settings:**
   - Ajustar % de comisión de Tienda Nube
   - Configurar fees por método de pago
   - Agregar costos de publicidad

2. **Sincronizar Datos Históricos:**
   - La sync inicial trae órdenes de los últimos 90 días
   - Puedes ajustar esto en `app/api/orders/sync/route.ts`

3. **Monitorear Webhooks:**
   - Los webhooks mantienen los datos actualizados en tiempo real
   - Se registran automáticamente durante el onboarding

---

## 💡 Comandos Útiles

```bash
# Ver base de datos visualmente
npx prisma studio

# Resetear base de datos (⚠️ BORRA TODOS LOS DATOS)
npx prisma migrate reset

# Generar nuevas migraciones después de cambios en schema
npx prisma migrate dev --name nombre_de_migracion

# Ver logs de Prisma
export DEBUG="prisma:*"
npm run dev
```

---

**¿Necesitas ayuda?** Revisa los logs en:
- Consola del navegador (F12)
- Terminal donde corre `npm run dev`
- Vercel dashboard → Deployments → Logs
