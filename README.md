# 📊 PNL Analytics - Tienda Nube

Dashboard completo para calcular el **Profit & Loss (PNL)** de tu tienda en Tienda Nube.

## 🚀 Características

### ✅ Cálculos Automáticos
- **Ventas Brutas**: Total de ingresos por ventas
- **Comisiones Tienda Nube**: Calcula automáticamente el % de comisión
- **Comisiones de Pago**: Según método de pago (tarjeta, transferencia, etc.)
- **Costos de Envío**: Integrado con datos de la orden
- **Costos de Producto**: Desde los costos configurados en Tienda Nube
- **Publicidad**: Configuración manual (próximamente Meta Ads y TikTok Ads)
- **Ganancia Neta**: Cálculo automático de profit

### 📈 Visualizaciones
- **Gráficos de Línea/Barra**: Evolución de ventas, costos y ganancias
- **Gráfico de Torta**: Desglose visual de costos
- **Métricas en Tiempo Real**: KPIs principales en tarjetas
- **Tabla de Ventas**: Detalle completo de cada transacción

### 🕐 Períodos de Análisis
- **Diario**: Análisis día por día
- **Semanal**: Agrupación por semana
- **Mensual**: Vista consolidada mensual

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **Deploy**: Vercel

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` con:

```env
# Tienda Nube API
TIENDANUBE_CLIENT_ID=your_client_id
TIENDANUBE_CLIENT_SECRET=your_client_secret
TIENDANUBE_REDIRECT_URI=https://tu-app.vercel.app/api/auth/callback

# Base de datos (próximamente)
DATABASE_URL=your_database_url

# Next Auth (próximamente)
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://tu-app.vercel.app
```

## 📊 Estructura de Costos

### Comisiones por Defecto

```typescript
{
  tiendaNubeFee: 3%, // Comisión de Tienda Nube
  paymentMethods: {
    credit_card: 5%,      // Tarjeta de crédito
    debit_card: 3%,       // Tarjeta de débito
    transfer: 0%,         // Transferencia
    mercadopago: 4.99%    // Mercado Pago
  }
}
```

## 🎯 Roadmap

### ✅ Fase 1 - MVP (Completado)
- [x] Dashboard visual con métricas clave
- [x] Gráficos de ventas y costos
- [x] Desglose de costos
- [x] Tabla de ventas detallada
- [x] Filtros por período

### 🚧 Fase 2 - Integración (En Progreso)
- [ ] Autenticación OAuth con Tienda Nube
- [ ] Sincronización automática de órdenes
- [ ] Webhooks en tiempo real
- [ ] Base de datos para persistencia

### 🔮 Fase 3 - Avanzado
- [ ] Integración con Meta Ads
- [ ] Integración con TikTok Ads
- [ ] Configuración personalizada de costos
- [ ] Exportar reportes PDF/Excel
- [ ] Comparación de períodos
- [ ] Alertas y notificaciones

## 📱 Despliegue en Vercel

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno
3. Deploy automático con cada push

```bash
# O usando Vercel CLI
vercel deploy
```

## 🔐 Seguridad

- Autenticación OAuth 2.0
- Tokens de acceso seguros
- Variables de entorno para credenciales
- HTTPS obligatorio

## 📝 Uso

1. **Conectar Tienda**: Click en "Conectar Tienda Nube"
2. **Autorizar App**: Acepta los permisos solicitados
3. **Ver Dashboard**: Los datos se sincronizan automáticamente
4. **Configurar Costos**: Ajusta comisiones y costos de publicidad
5. **Analizar PNL**: Revisa métricas y gráficos

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles

## 👤 Autor

Creado para optimizar el análisis financiero de tiendas en Tienda Nube.

## 🆘 Soporte

¿Preguntas o problemas? Abre un issue en GitHub.

---

**¡Calcula tu PNL con precisión y toma mejores decisiones de negocio!** 📈
