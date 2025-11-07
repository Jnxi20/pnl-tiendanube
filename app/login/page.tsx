'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Store, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_init_failed: 'No se pudo iniciar la autenticación',
        invalid_state: 'Error de seguridad. Por favor, intenta nuevamente',
        missing_parameters: 'Parámetros faltantes en la respuesta',
        authentication_failed: 'Falló la autenticación con Tienda Nube',
      };

      setError(
        errorMessages[errorParam] || 'Ocurrió un error durante el login'
      );
    }
  }, [searchParams]);

  const handleLogin = () => {
    window.location.href = '/api/auth/tiendanube';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PNL Analytics
          </h1>
          <p className="text-gray-600">
            Analiza la rentabilidad de tu tienda Nube
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Análisis de Rentabilidad
                </h3>
                <p className="text-sm text-gray-600">
                  Calcula costos reales y ganancias netas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg mt-0.5">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Reportes Detallados
                </h3>
                <p className="text-sm text-gray-600">
                  Visualiza métricas y tendencias en tiempo real
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg mt-0.5">
                <Store className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Sincronización Automática
                </h3>
                <p className="text-sm text-gray-600">
                  Conecta con Tienda Nube sin esfuerzo
                </p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base font-semibold"
          >
            <Store className="w-5 h-5" />
            Conectar con Tienda Nube
          </button>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Al conectarte, autorizas a PNL Analytics a acceder a tus órdenes y
            productos de Tienda Nube
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Necesitas ayuda?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Contacta soporte
          </a>
        </p>
      </div>
    </div>
  );
}
