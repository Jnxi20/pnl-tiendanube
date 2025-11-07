import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PNL Analytics - Tienda Nube',
  description: 'Calcula tu Profit & Loss de Tienda Nube con precisión',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
