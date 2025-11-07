// components/CostBreakdown.tsx
'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardMetrics } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface CostBreakdownProps {
  metrics: DashboardMetrics;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export default function CostBreakdown({ metrics }: CostBreakdownProps) {
  const data = [
    { 
      name: 'Comisiones Tienda Nube', 
      value: metrics.costBreakdown.tiendaNubeFees,
      percentage: (metrics.costBreakdown.tiendaNubeFees / metrics.totalCosts * 100).toFixed(1)
    },
    { 
      name: 'Comisiones de Pago', 
      value: metrics.costBreakdown.paymentFees,
      percentage: (metrics.costBreakdown.paymentFees / metrics.totalCosts * 100).toFixed(1)
    },
    { 
      name: 'Costos de Envío', 
      value: metrics.costBreakdown.shippingCosts,
      percentage: (metrics.costBreakdown.shippingCosts / metrics.totalCosts * 100).toFixed(1)
    },
    { 
      name: 'Costos de Producto', 
      value: metrics.costBreakdown.productCosts,
      percentage: (metrics.costBreakdown.productCosts / metrics.totalCosts * 100).toFixed(1)
    },
    { 
      name: 'Publicidad', 
      value: metrics.costBreakdown.advertisingCosts,
      percentage: (metrics.costBreakdown.advertisingCosts / metrics.totalCosts * 100).toFixed(1)
    },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
          <p className="text-sm text-gray-500">{data.percentage}% del total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Desglose de Costos
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(item.value)}
              </p>
              <p className="text-xs text-gray-500">{item.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
