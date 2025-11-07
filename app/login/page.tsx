'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        missing_parameters: 'Faltan parámetros requeridos para la autenticación',
        invalid_state: 'Error de seguridad: estado OAuth inválido',
        authentication_failed: 'Falló la autenticación con Tienda Nube',
        oauth_error: 'Error de OAuth',
      };
      setError(errorMessages[errorParam] || 'Error desconocido de autenticación');
    }
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/api/auth/tiendanube');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PNL Analytics
            </h1>
            <p className="text-sm text-gray-600">
              Tienda Nube Dashboard
            </p>
          </div>

          {error ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                      Error de Conexión
                    </h3>
                    <p className="text-sm text-red-800">
                      {error}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full btn-primary"
                >
                  Intentar Nuevamente
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full btn-secondary"
                >
                  Volver al Inicio
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Posibles Soluciones:
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Verifica que tu URL de callback esté configurada en Tienda Nube</li>
                  <li>• Asegúrate de tener permisos de lectura de órdenes</li>
                  <li>• Intenta cerrar sesión y volver a conectar</li>
                  <li>• Revisa que tus credenciales de API sean correctas</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  Conecta tu tienda de Tienda Nube para comenzar a analizar tus ventas
                </p>
              </div>

              <button
                onClick={handleRetry}
                className="w-full btn-primary"
              >
                Conectar Tienda Nube
              </button>

              <button
                onClick={handleGoHome}
                className="w-full btn-secondary mt-3"
              >
                Volver al Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
