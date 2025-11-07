'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Percent,
  BarChart3,
  LineChart as LineChartIcon,
  Loader2,
  RefreshCw,
  Clock
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import PeriodFilter from '@/components/PeriodFilter';
import ProfitChart from '@/components/ProfitChart';
import CostBreakdown from '@/components/CostBreakdown';
import SalesTable from '@/components/SalesTable';
import { mockSales } from '@/lib/mockData';
import { calculateDashboardMetrics, prepareChartData, formatCurrency, formatPercentage } from '@/lib/calculations';
import type { Sale } from '@/types';

// Constants for sync behavior
const SYNC_INTERVAL_MINUTES = 60; // Only sync if last sync was >60 minutes ago
const STORAGE_KEY_LAST_SYNC = 'pnl_last_sync_time';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Check if sync is needed
  const shouldSync = () => {
    if (typeof window === 'undefined') return false;

    const lastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    if (!lastSync) return true;

    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    const minutesSinceSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60);

    return minutesSinceSync >= SYNC_INTERVAL_MINUTES;
  };

  // Perform sync
  const performSync = async () => {
    setIsSyncing(true);
    setSyncMessage('Sincronizando órdenes...');

    try {
      const syncResponse = await fetch('/api/orders/sync', {
        method: 'POST',
      });

      if (syncResponse.ok) {
        const syncPayload = await syncResponse.json();
        setSyncMessage(`Sincronización completada: ${syncPayload.imported || 0} nuevas órdenes`);
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
        setLastSyncTime(new Date());

        // Refresh orders after sync
        await fetchOrders(true);
      } else {
        const errorPayload = await syncResponse.json().catch(() => null);
        setSyncMessage('Error al sincronizar, usando datos en caché');
        console.warn('Background sync failed', errorPayload);
      }
    } catch (syncError) {
      setSyncMessage('No se pudo conectar para sincronizar');
      console.warn('Unable to trigger background sync', syncError);
    } finally {
      setIsSyncing(false);
      // Clear sync message after 3 seconds
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // Fetch real orders from API
  const fetchOrders = async (skipSync = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Only sync if needed and not skipped
      if (!skipSync && shouldSync()) {
        await performSync();
        return; // performSync will call fetchOrders again
      }

      const response = await fetch('/api/orders');

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();

      // Restore last sync time from localStorage
      const lastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }

      if (data.success && data.orders && data.orders.length > 0) {
        setSales(data.orders);
        setIsUsingMockData(false);
      } else {
        // No orders found, use mock data
        setSales(mockSales);
        setIsUsingMockData(true);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fall back to mock data on error
      setSales(mockSales);
      setIsUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, []);

  // Calcular métricas del dashboard
  const metrics = useMemo(() => calculateDashboardMetrics(sales), [sales]);

  // Preparar datos para el gráfico
  const chartData = useMemo(() =>
    prepareChartData(sales, selectedPeriod === 'daily' ? 'day' : selectedPeriod === 'weekly' ? 'week' : 'month'),
    [sales, selectedPeriod]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard PNL</h1>
              <p className="text-sm text-gray-600 mt-1">
                Análisis de Profit & Loss de tu Tienda Nube
              </p>
              {lastSyncTime && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  Última sincronización: {lastSyncTime.toLocaleString('es-AR')}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => performSync()}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isSyncing
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button className="btn-secondary">
                Exportar Reporte
              </button>
              <button className="btn-primary">
                Conectar Tienda Nube
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Filter */}
        <div className="mb-6">
          <PeriodFilter 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Ventas Totales"
            value={formatCurrency(metrics.totalRevenue)}
            subtitle={`${metrics.totalOrders} órdenes`}
            icon={DollarSign}
            color="blue"
            trend={{ value: 12.5, isPositive: true }}
          />
          <MetricCard
            title="Ganancia Neta"
            value={formatCurrency(metrics.netProfit)}
            subtitle={formatPercentage(metrics.profitMargin)}
            icon={TrendingUp}
            color="green"
            trend={{ value: 8.3, isPositive: true }}
          />
          <MetricCard
            title="Costos Totales"
            value={formatCurrency(metrics.totalCosts)}
            subtitle="Todos los gastos"
            icon={ShoppingCart}
            color="red"
          />
          <MetricCard
            title="Margen Promedio"
            value={formatPercentage(metrics.profitMargin)}
            subtitle={`${formatCurrency(metrics.averageProfit)} por orden`}
            icon={Percent}
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="mb-4 flex justify-end gap-2">
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-lg transition-colors ${
                  chartType === 'line' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <LineChartIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-lg transition-colors ${
                  chartType === 'bar' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
            <ProfitChart data={chartData} type={chartType} />
          </div>
          <div>
            <CostBreakdown metrics={metrics} />
          </div>
        </div>

        {/* Sales Table */}
        <div className="mb-8">
          {isLoading ? (
            <div className="card flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="ml-3 text-gray-600">Cargando órdenes...</p>
            </div>
          ) : (
            <SalesTable sales={sales} />
          )}
        </div>

        {/* Sync Status Message */}
        {syncMessage && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
              <div>
                <p className="text-sm text-yellow-800">{syncMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        {isUsingMockData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  📊 Datos de Prueba
                </h3>
                <p className="text-sm text-blue-800 mb-2">
                  {error
                    ? `No se pudieron cargar las órdenes reales: ${error}. Mostrando datos de ejemplo.`
                    : 'No se encontraron órdenes sincronizadas. Mostrando datos de ejemplo.'}
                </p>
                <p className="text-xs text-blue-700">
                  Haz clic en el botón "Sincronizar" en la parte superior para traer tus datos reales de Tienda Nube.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isUsingMockData && !isLoading && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  ✅ Datos Reales de tu Tienda
                </h3>
                <p className="text-sm text-green-800">
                  Mostrando {sales.length} órdenes sincronizadas desde tu Tienda Nube.
                </p>
                {lastSyncTime && (
                  <p className="text-xs text-green-700 mt-1">
                    Última actualización: {lastSyncTime.toLocaleString('es-AR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            PNL Analytics para Tienda Nube - Calcula tu Profit & Loss con precisión
          </p>
        </div>
      </footer>
    </div>
  );
}
