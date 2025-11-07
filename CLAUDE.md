# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 14 TypeScript application** that provides Profit & Loss (PNL) analytics for Tienda Nube e-commerce stores. Tienda Nube is a popular e-commerce platform in Latin America.

**Current State:** Phase 1 MVP is complete with mock data and full PNL calculations. Phase 2 (OAuth + API integration) and Phase 3 (advanced features) are planned but not yet implemented.

## Development Commands

```bash
npm run dev    # Start development server (localhost:3000)
npm run build  # Create production build
npm start      # Run production server
npm run lint   # Run ESLint validation
```

**Note:** There is currently no testing infrastructure in this project.

## Tech Stack

- **Framework:** Next.js 14.2.5 (App Router architecture)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4.1 with custom utility classes
- **Charts:** Recharts 2.12.7
- **Icons:** Lucide React
- **Date Handling:** date-fns 3.6.0
- **Deployment:** Vercel (optimized)

## Architecture

### Directory Structure

```
app/          # Next.js 14 App Router
  ├── page.tsx        # Main dashboard (client component)
  ├── layout.tsx      # Root layout
  └── globals.css     # Tailwind + custom styles

components/   # React components
  ├── MetricCard.tsx      # KPI display cards
  ├── ProfitChart.tsx     # Line/Bar charts
  ├── CostBreakdown.tsx   # Pie chart for costs
  ├── SalesTable.tsx      # Transaction details
  └── PeriodFilter.tsx    # Period selector

lib/          # Business logic
  ├── calculations.ts     # PNL calculation functions
  └── mockData.ts         # Sample data (Phase 1)

types/        # TypeScript definitions
  └── index.ts            # All interfaces
```

### Data Flow

1. **Mock Data** (`lib/mockData.ts`) provides sample orders
2. **Calculations** (`lib/calculations.ts`) process sales into metrics
3. **Components** consume calculated data and render UI
4. **Types** (`types/index.ts`) ensure type safety throughout

### Key Business Logic

The PNL calculations in `lib/calculations.ts` handle:

- **Revenue:** Gross revenue per order
- **Costs:**
  - Tienda Nube fees (default 3%)
  - Payment method fees (variable by method)
  - Shipping costs
  - Product costs (COGS)
  - Advertising costs
- **Metrics:** Net revenue, profit margin, average order value

All monetary values use **Argentine Peso (ARS)** currency.

### Component Patterns

- All components use `'use client'` directive (client-side rendering)
- Functional components with React hooks (`useState`, `useMemo`)
- Calculations are memoized for performance
- Responsive design using Tailwind breakpoints
- Custom Tailwind classes defined in `globals.css`: `.card`, `.btn-primary`, `.btn-secondary`

### TypeScript Types

Key interfaces in `types/index.ts`:

- **Sale:** Complete order structure with products, payments, costs
- **Product:** Product details within orders
- **DashboardMetrics:** Aggregated analytics for display
- **ChartData:** Time-series data for visualizations
- **CostSettings:** Configurable fee structures

## Planned Features (Not Yet Implemented)

**Phase 2 - API Integration:**
- OAuth authentication with Tienda Nube API
- Real-time order synchronization
- Webhooks for live updates
- Database persistence (PostgreSQL/MongoDB mentioned in README)

**Phase 3 - Advanced Features:**
- Meta Ads & TikTok Ads integration for ad cost tracking
- PDF/Excel export functionality
- Custom cost configuration UI
- Period-over-period comparisons
- Alerts and notifications

**Environment Variables:** See `.env.example` for planned API credentials and database URLs.

## Development Notes

- **No Tests:** There are no test files or testing frameworks configured
- **Linting:** Uses Next.js built-in ESLint
- **Styling:** Utility-first Tailwind with semantic color coding (blue=revenue, red=costs, green=profit)
- **Date Format:** ISO strings converted with date-fns
- **Currency Format:** `Intl.NumberFormat` with 'es-AR' locale for ARS
