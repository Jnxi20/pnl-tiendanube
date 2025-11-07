'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<
    'connecting' | 'syncing' | 'complete' | 'error'
  >('connecting');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // Step 1: Verify connection
        setStatus('connecting');
        setProgress(25);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Step 2: Start initial sync
        setStatus('syncing');
        setProgress(50);

        const syncResponse = await fetch('/api/orders/sync', {
          method: 'POST',
        });

        if (!syncResponse.ok) {
          const errorData = await syncResponse.json().catch(() => ({}));
          throw new Error(errorData.details || 'Sync failed');
        }

        const syncData = await syncResponse.json();
        console.log('Sync result:', syncData);

        setProgress(75);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Step 3: Complete
        setStatus('complete');
        setProgress(100);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Redirect to dashboard
        router.push('/');
      } catch (error) {
        console.error('Onboarding error:', error);
        setStatus('error');
        setErrorMessage(
          'Hubo un error durante la configuración. Puedes continuar igualmente.'
        );

        // Redirect after 3 seconds even on error
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    }

    initialize();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'complete'
                ? '¡Todo listo!'
                : status === 'error'
                  ? 'Configuración Incompleta'
                  : 'Configurando tu cuenta'}
            </h1>
            <p className="text-gray-600">
              {status === 'complete'
                ? 'Tu tienda ha sido conectada exitosamente'
                : status === 'error'
                  ? 'Algunos pasos no se completaron'
                  : 'Estamos sincronizando tus datos'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4 mb-8">
            {/* Step 1: Connecting */}
            <div className="flex items-center gap-3">
              {status === 'connecting' ? (
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  Conectando con Tienda Nube
                </p>
                <p className="text-sm text-gray-600">
                  Verificando credenciales...
                </p>
              </div>
            </div>

            {/* Step 2: Syncing */}
            <div className="flex items-center gap-3">
              {status === 'connecting' ? (
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
              ) : status === 'syncing' ? (
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              ) : status === 'error' ? (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  Sincronizando órdenes
                </p>
                <p className="text-sm text-gray-600">
                  Importando datos históricos...
                </p>
              </div>
            </div>

            {/* Step 3: Complete */}
            <div className="flex items-center gap-3">
              {status === 'complete' ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : status === 'error' ? (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              ) : (
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  Configuración completa
                </p>
                <p className="text-sm text-gray-600">
                  Preparando tu dashboard...
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {status === 'complete' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Redirigiendo al dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
