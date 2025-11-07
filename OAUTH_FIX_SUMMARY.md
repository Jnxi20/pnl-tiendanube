# OAuth Connection Fix - Resumen de Cambios

## Problema Original
El usuario reportó que no podía conectar con Tienda Nube. El botón de conexión no funcionaba correctamente y no había forma de desconectar y reconectar la cuenta.

## Cambios Implementados

### 1. **API de Logout/Desconexión** (`/api/auth/logout`)
- Nueva ruta POST para desconectar la cuenta de Tienda Nube
- Limpia las cookies de autenticación (`pnl_user_id`, `pnl_store_id`, `oauth_state`)
- Permite al usuario reconectar su cuenta desde cero

**Archivo:** `app/api/auth/logout/route.ts`

### 2. **API de Estado de Autenticación** (`/api/auth/status`)
- Nueva ruta GET que verifica si el usuario está autenticado
- Devuelve información del usuario (storeId, storeName, email)
- Permite al frontend saber si hay una sesión activa

**Archivo:** `app/api/auth/status/route.ts`

### 3. **Mejoras en el Callback de OAuth**
- Añadido logging detallado en cada paso del flujo OAuth
- Mejor manejo de errores con mensajes específicos
- Los logs ahora muestran:
  - `[OAuth Callback] Exchanging code for token...`
  - `[OAuth Callback] Token exchange successful`
  - `[OAuth Callback] Store ID: {id}`
  - `[OAuth Callback] Fetching store information...`
  - `[OAuth Callback] Store info retrieved: {name}`
  - `[OAuth Callback] Creating/updating user in database...`
  - `[OAuth Callback] User created/updated: {userId}`
  - `[OAuth Callback] OAuth flow complete, redirecting to onboarding`
  - `[OAuth Callback] Cookies set successfully`

**Archivo:** `app/api/auth/callback/route.ts`

### 4. **Dashboard con Estado de Conexión**
El dashboard ahora:
- **Verifica el estado de autenticación** al cargar
- **Muestra el nombre de la tienda** cuando está conectado
- **Muestra un indicador verde** de conexión activa
- **Cambia el botón dinámicamente**:
  - "Conectar Tienda Nube" cuando NO está conectado
  - "Desconectar Tienda" cuando SÍ está conectado
- **Oculta el botón "Sincronizar"** cuando no está autenticado

**Archivo:** `app/page.tsx`

## Cómo Probar la Solución

### Escenario 1: Primera Conexión
1. Abre http://localhost:3000
2. Verás el botón **"Conectar Tienda Nube"**
3. Haz click → serás redirigido a Tienda Nube
4. Autoriza la aplicación
5. Serás redirigido a `/onboarding` que sincronizará órdenes automáticamente
6. Volverás al dashboard con tu tienda conectada

**Indicadores de éxito:**
- En el header verás: "Conectado: [Nombre de tu tienda]" con un punto verde
- El botón cambiará a "Desconectar Tienda"
- Aparecerá el botón "Sincronizar"

### Escenario 2: Desconectar y Reconectar
1. Con la tienda ya conectada, haz click en **"Desconectar Tienda"**
2. La sesión se cerrará y volverás a ver datos de prueba
3. El botón volverá a decir "Conectar Tienda Nube"
4. Puedes volver a conectar haciendo click nuevamente

### Escenario 3: Depurar Errores de OAuth
Si el OAuth falla, ahora puedes ver logs detallados en la terminal donde corre `npm run dev`:

```bash
# Ejemplo de logs exitosos:
[OAuth Callback] Exchanging code for token...
[OAuth Callback] Token exchange successful
[OAuth Callback] Store ID: 123456
[OAuth Callback] Fetching store information...
[OAuth Callback] Store info retrieved: Mi Tienda Demo
[OAuth Callback] Creating/updating user in database...
[OAuth Callback] User created/updated: clxxxxx
[OAuth Callback] OAuth flow complete, redirecting to onboarding
[OAuth Callback] Cookies set successfully

# Si hay errores, verás:
[OAuth Callback] Store info fetch failed: 401 - Unauthorized
OAuth callback error: Error: Failed to fetch store info: 401 - Unauthorized
```

## Verificaciones Importantes

### 1. Redirect URI Configurado
Asegúrate de que en el panel de Tienda Nube Partners (https://partners.tiendanube.com) tengas configurado:
```
http://localhost:3000/api/auth/callback
```

### 2. Variables de Entorno
Verifica que `.env.local` tenga:
```
TIENDANUBE_CLIENT_ID=22728
TIENDANUBE_CLIENT_SECRET=0bb6feee8749e3e0cb0fb6ae5dcdf167292f24a068c75326
TIENDANUBE_REDIRECT_URI=http://localhost:3000/api/auth/callback
ENCRYPTION_KEY=tu_encryption_key_aqui
```

### 3. Base de Datos
Asegúrate de que `prisma/dev.db` existe y tiene las tablas correctas:
```bash
ls -lh prisma/dev.db
# Debería mostrar ~136KB
```

## Errores Comunes y Soluciones

### Error: "invalid_state"
**Causa:** Las cookies no se están guardando correctamente
**Solución:**
- Verifica que no estés en modo incógnito con cookies bloqueadas
- Limpia las cookies del navegador
- Intenta en una ventana normal del navegador

### Error: "authentication_failed"
**Causa:** El intercambio de código por token falló
**Solución:**
- Revisa los logs en la terminal
- Verifica que el Client Secret sea correcto
- Asegúrate de que el redirect URI coincida exactamente

### Error: "Not authenticated" al sincronizar
**Causa:** La sesión no está activa
**Solución:**
- Primero conecta con "Conectar Tienda Nube"
- Espera a ver el indicador verde de conexión
- Luego intenta sincronizar

## Estado Actual

✅ Logout endpoint creado
✅ Status check endpoint creado
✅ OAuth callback mejorado con logging
✅ Dashboard actualizado con estado de conexión
✅ Botones dinámicos (Conectar/Desconectar)
✅ Indicador visual de conexión activa

## Próximos Pasos

Ahora deberías poder:
1. Conectar tu tienda
2. Ver el nombre de tu tienda en el header
3. Sincronizar órdenes
4. Desconectar cuando quieras
5. Reconectar sin problemas

Si aún tienes problemas, revisa los logs en la terminal donde corre el servidor para ver exactamente en qué paso está fallando el OAuth.
