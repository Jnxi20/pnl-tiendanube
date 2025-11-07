# Instrucciones de Configuración - PNL Tienda Nube

## ✅ Estado Actual
- ✅ Base de datos inicializada (136KB)
- ✅ Servidor corriendo en http://localhost:3000
- ✅ Credenciales configuradas (Client ID: 22728)
- ✅ OAuth mejorado con logging detallado y manejo de errores
- ✅ Funcionalidad de desconectar/reconectar implementada

## 🔧 Configuración Requerida en Tienda Nube

### 1. Configurar Redirect URI en el Panel de Desarrolladores

Debes ir al panel de desarrolladores de Tienda Nube y agregar la siguiente URL de redirección:

**URL a agregar:**
```
http://localhost:3000/api/auth/callback
```

**Pasos:**
1. Ve a https://partners.tiendanube.com
2. Inicia sesión con tu cuenta de Partner
3. Ve a "Mis Aplicaciones" o "My Apps"
4. Busca tu aplicación (Client ID: 22728)
5. En la sección de "URLs de Redirección" o "Redirect URIs", agrega:
   - `http://localhost:3000/api/auth/callback`
6. Guarda los cambios

### 2. Verificar Permisos de la App

Asegúrate de que tu aplicación tenga los siguientes permisos:
- ✅ `read_orders` - Para leer las órdenes
- ✅ `read_products` - Para leer productos
- ✅ `write_products` - Para actualizar productos (opcional)

## 🚀 Cómo Probar la Conexión

### Opción A: Conectar Tienda Nube (Primera vez)
1. Abre http://localhost:3000
2. Click en el botón **"Conectar Tienda Nube"**
3. Serás redirigido a Tienda Nube para autorizar
4. Después de autorizar, volverás a la app
5. Deberías ver tu nombre de tienda en el header

### Opción B: Si ya estás conectado
1. Abre http://localhost:3000
2. Verás tu nombre de tienda con un indicador verde: "Conectado: [Nombre Tienda]"
3. Click en el botón **"Sincronizar"**
4. Espera a que se importen las órdenes
5. Verás un mensaje: "Sincronización completada: X nuevas órdenes"

### Opción C: Desconectar y Reconectar
Si necesitas cambiar de cuenta o resolver problemas de conexión:
1. Abre http://localhost:3000
2. Si estás conectado, verás el botón **"Desconectar Tienda"**
3. Click en "Desconectar Tienda" → La sesión se cerrará
4. Ahora verás el botón **"Conectar Tienda Nube"** de nuevo
5. Puedes reconectar con la misma u otra cuenta de Tienda Nube

## 🐛 Solución de Problemas

### Error: "Redirect URI mismatch"
**Causa:** La URL de callback no está configurada en Tienda Nube
**Solución:** Sigue el paso 1 arriba

### Error: "Invalid client credentials"
**Causa:** El Client ID o Secret son incorrectos
**Solución:** Verifica que sean:
- Client ID: `22728`
- Client Secret: `0bb6feee8749e3e0cb0fb6ae5dcdf167292f24a068c75326`

### Error: "Not authenticated" al sincronizar
**Causa:** No estás autenticado
**Solución:** Primero haz click en "Conectar Tienda Nube"

### El botón no hace nada
**Causa:** Error de JavaScript en el navegador
**Solución:** Abre la consola del navegador (F12) y mira los errores

## 📊 Ver Datos Reales

Una vez conectado y sincronizado:
1. Verás tus órdenes reales en la tabla
2. Click en cualquier orden para ver el **desglose completo**:
   - Venta Bruta
   - Comisión Tienda Nube
   - Comisión Gateway (incluye cuotas sin interés)
   - Costo de Envío
   - Costo de Productos (COGS)
   - Publicidad
   - Ganancia Neta y Margen %

## 🔍 Logs para Debugging

Si algo no funciona, revisa los logs del servidor:
```bash
# En la terminal donde corre npm run dev
# Verás mensajes como:
[TiendaNube] Sample orders from API: [...]
Error fetching orders: ...

# Durante el proceso OAuth verás:
[OAuth Callback] Exchanging code for token...
[OAuth Callback] Token exchange successful
[OAuth Callback] Store ID: 123456
[OAuth Callback] Fetching store information...
[OAuth Callback] Store info retrieved: Mi Tienda
[OAuth Callback] Creating/updating user in database...
[OAuth Callback] User created/updated: clxxxxx
[OAuth Callback] OAuth flow complete, redirecting to onboarding
[OAuth Callback] Cookies set successfully
```

**Ver los logs en tiempo real:** Los logs del OAuth aparecerán cuando hagas click en "Conectar Tienda Nube" y completes la autorización. Si hay algún error, verás exactamente en qué paso falló.

## 📝 Datos que Verás

La app muestra **todos** los datos financieros de Tienda Nube:
- `grossRevenue` - Total de la venta
- `tiendaNubeFee` - Comisión Tienda Nube (5.31% por defecto)
- `paymentFee` - Comisión del gateway (`gateway_fee` + `installments_cost`)
- `shippingCost` - Costo real de envío (`shipping_cost_owner`)
- `productCost` - COGS (`products[].cost`)
- `netRevenue` - Ganancia neta
- `netMargin` - Margen porcentual
