// lib/calculations.ts
import { Sale, DashboardMetrics, ChartData } from '@/types';

export function calculateNetRevenue(sale: Sale): number {
  const totalCosts = 
    sale.tiendaNubeFee +
    sale.paymentFee +
    sale.shippingCost +
    sale.productCost +
    sale.advertisingCost;
  
  return sale.grossRevenue - totalCosts;
}

export function calculateNetMargin(grossRevenue: number, netRevenue: number): number {
  if (grossRevenue === 0) return 0;
  return (netRevenue / grossRevenue) * 100;
}

export function calculateDashboardMetrics(sales: Sale[]): DashboardMetrics {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.grossRevenue, 0);
  
  const costBreakdown = {
    tiendaNubeFees: sales.reduce((sum, sale) => sum + sale.tiendaNubeFee, 0),
    paymentFees: sales.reduce((sum, sale) => sum + sale.paymentFee, 0),
    shippingCosts: sales.reduce((sum, sale) => sum + sale.shippingCost, 0),
    productCosts: sales.reduce((sum, sale) => sum + sale.productCost, 0),
    advertisingCosts: sales.reduce((sum, sale) => sum + sale.advertisingCost, 0),
  };
  
  const totalCosts = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0);
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  return {
    totalRevenue,
    totalCosts,
    netProfit,
    profitMargin,
    costBreakdown,
    totalOrders: sales.length,
    averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
    averageProfit: sales.length > 0 ? netProfit / sales.length : 0,
  };
}

export function prepareChartData(sales: Sale[], groupBy: 'day' | 'week' | 'month'): ChartData[] {
  const grouped = new Map<string, { revenue: number; costs: number }>();
  
  sales.forEach(sale => {
    const date = new Date(sale.date);
    let key: string;
    
    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const existing = grouped.get(key) || { revenue: 0, costs: 0 };
    const costs = sale.tiendaNubeFee + sale.paymentFee + sale.shippingCost + 
                  sale.productCost + sale.advertisingCost;
    
    grouped.set(key, {
      revenue: existing.revenue + sale.grossRevenue,
      costs: existing.costs + costs,
    });
  });
  
  return Array.from(grouped.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      costs: data.costs,
      profit: data.revenue - data.costs,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
