// types/index.ts
export interface Sale {
  id: string;
  orderNumber: number;
  date: string;
  customerName: string;
  
  // Ingresos
  grossRevenue: number; // Venta bruta total
  
  // Costos
  tiendaNubeFee: number; // Comisión de Tienda Nube
  paymentFee: number; // Comisión del método de pago
  shippingCost: number; // Costo de envío
  productCost: number; // Costo del producto
  advertisingCost: number; // Costo de publicidad (manual)
  
  // Calculados
  netRevenue: number; // Ganancia neta
  netMargin: number; // Margen neto (%)
  
  // Detalles
  paymentMethod: string;
  shippingMethod: string;
  products: Product[];
  
  // Metadata
  currency: string;
  status: 'paid' | 'pending' | 'cancelled';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  cost: number;
  total: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  
  // Desglose de costos
  costBreakdown: {
    tiendaNubeFees: number;
    paymentFees: number;
    shippingCosts: number;
    productCosts: number;
    advertisingCosts: number;
  };
  
  // Estadísticas
  totalOrders: number;
  averageOrderValue: number;
  averageProfit: number;
}

export interface ChartData {
  date: string;
  revenue: number;
  costs: number;
  profit: number;
}

export interface PeriodFilter {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
}

export interface CostSettings {
  tiendaNubeFeePercentage: number; // % comisión Tienda Nube
  paymentMethods: {
    [key: string]: {
      name: string;
      feePercentage: number;
      fixedFee: number;
    };
  };
}
