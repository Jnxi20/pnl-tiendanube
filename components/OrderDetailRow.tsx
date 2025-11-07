'use client';

import React from 'react';
import { Sale } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/calculations';
import {
  Package,
  Truck,
  CreditCard,
  TrendingDown,
  Tag,
  DollarSign,
  Percent,
  ShoppingBag
} from 'lucide-react';

interface OrderDetailRowProps {
  sale: Sale;
}

export default function OrderDetailRow({ sale }: OrderDetailRowProps) {
  const totalCosts = sale.tiendaNubeFee + sale.paymentFee +
                     sale.shippingCost + sale.productCost + sale.advertisingCost;

  return (
    <div className="bg-gray-50 p-6 border-t border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Financial Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Desglose Financiero
          </h4>

          {/* Revenue */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-medium text-gray-700">Venta Bruta</span>
              <span className="text-sm font-bold text-blue-600">
                {formatCurrency(sale.grossRevenue)}
              </span>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs text-gray-600">Comisión Tienda Nube</span>
                </div>
                <span className="text-xs font-medium text-red-600">
                  -{formatCurrency(sale.tiendaNubeFee)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs text-gray-600">Comisión Gateway</span>
                </div>
                <span className="text-xs font-medium text-red-600">
                  -{formatCurrency(sale.paymentFee)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs text-gray-600">Costo Envío</span>
                </div>
                <span className="text-xs font-medium text-red-600">
                  -{formatCurrency(sale.shippingCost)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs text-gray-600">Costo Productos</span>
                </div>
                <span className="text-xs font-medium text-red-600">
                  -{formatCurrency(sale.productCost)}
                </span>
              </div>

              {sale.advertisingCost > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs text-gray-600">Publicidad</span>
                  </div>
                  <span className="text-xs font-medium text-red-600">
                    -{formatCurrency(sale.advertisingCost)}
                  </span>
                </div>
              )}
            </div>

            {/* Net Revenue */}
            <div className="mt-3 pt-3 border-t-2 border-gray-300 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">Ganancia Neta</span>
              <span className={`text-sm font-bold ${
                sale.netRevenue > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(sale.netRevenue)}
              </span>
            </div>

            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-gray-600">Margen</span>
              <span className={`text-xs font-medium ${
                sale.netMargin > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(sale.netMargin)}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Column - Products */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Productos ({sale.products.length})
          </h4>

          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {sale.products.map((product, index) => (
              <div key={product.id || index} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    {product.sku && (
                      <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    x{product.quantity}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Precio Unit.</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Costo Unit.</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(product.cost)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 block">Total</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(product.total)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Margen del producto</span>
                    <span className={`font-medium ${
                      product.price - product.cost > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency((product.price - product.cost) * product.quantity)}
                      {' '}
                      ({formatPercentage(product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0)})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Payment & Shipping Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Detalles de Pago y Envío
          </h4>

          {/* Payment Info */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="text-xs font-semibold text-gray-700 uppercase mb-3">
              Método de Pago
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Método</span>
                <span className="text-sm font-medium text-gray-900">
                  {sale.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comisión</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(sale.paymentFee)}
                </span>
              </div>
              {sale.paymentFee > 0 && sale.grossRevenue > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">% del total</span>
                  <span className="text-xs font-medium text-gray-600">
                    {formatPercentage((sale.paymentFee / sale.grossRevenue) * 100)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h5 className="text-xs font-semibold text-gray-700 uppercase mb-3">
              Envío
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Método</span>
                <span className="text-sm font-medium text-gray-900">
                  {sale.shippingMethod}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Costo</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(sale.shippingCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <h5 className="text-xs font-semibold text-gray-700 uppercase mb-3">
              Resumen
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Total Costos</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(totalCosts)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">% de Costos</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatPercentage((totalCosts / sale.grossRevenue) * 100)}
                </span>
              </div>
              <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Rentabilidad</span>
                <span className={`text-sm font-bold ${
                  sale.netMargin > 20 ? 'text-green-600' :
                  sale.netMargin > 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {sale.netMargin > 20 ? 'Excelente' :
                   sale.netMargin > 10 ? 'Buena' :
                   sale.netMargin > 0 ? 'Baja' : 'Pérdida'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
