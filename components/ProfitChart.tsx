// components/ProfitChart.tsx
'use client';

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData } from '@/types';

interface ProfitChartProps {
  data: ChartData[];
  type: 'line' | 'bar';
}

export default function ProfitChart({ data, type = 'line' }: ProfitChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartComponent = type === 'line' ? LineChart : BarChart;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Evolución de Ventas y Ganancias
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {type === 'line' ? (
            <>
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Ventas Brutas"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="costs" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Costos Totales"
                dot={{ fill: '#ef4444', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Ganancia Neta"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </>
          ) : (
            <>
              <Bar dataKey="revenue" fill="#3b82f6" name="Ventas Brutas" />
              <Bar dataKey="costs" fill="#ef4444" name="Costos Totales" />
              <Bar dataKey="profit" fill="#10b981" name="Ganancia Neta" />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
