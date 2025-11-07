# Repository Guidelines

Use this guide to keep contributions consistent and deploy-ready.

## Project Structure & Module Organization

- `app/`: Next.js App Router endpoints, layouts, and route handlers for dashboard flows.
- `components/`: Reusable UI blocks; colocate shared component hooks here.
- `lib/`: Shared business logic (PNL math, API utilities), third-party integrations, and client helpers.
- `types/`: Global TypeScript types; leverage the `@/*` alias defined in `tsconfig.json`.
- `prisma/`: Database schema and migrations; run against a TiendaNube-linked database.
- `magsnap-pnl-dashboard/`: Reference assets and design prototypes used by dashboard screens.

## Build, Test, and Development Commands

- `npm run dev`: Local development server with hot reload.
- `npm run build`: Production bundle; run before shipping to confirm routes compile cleanly.
- `npm run start`: Runs the compiled build for smoke testing.
- `npm run lint`: ESLint check with Next.js defaults; required before opening a PR.
- `npx prisma migrate dev`: Applies pending schema updates to your local database.

## Coding Style & Naming Conventions

- Use TypeScript with strict mode and descriptive types; keep default exports named after the route or domain.
- Follow component-driven naming (`SalesChart`, `validateOrders`) and keep Tailwind classes ordered layout → spacing → color.
- Stick to Next.js/ESLint formatting; when in doubt, run `npm run lint` and match existing server/client component patterns.

## Testing Guidelines

Automated tests are not yet established. When adding coverage, colocate unit specs near the code (`app/feature/__tests__/...`) using Vitest or Jest, and stub external APIs with MSW. Prioritize regression tests for PNL calculators and integration tests for authentication. Document new test commands in `package.json` and update this guide.

## Commit & Pull Request Guidelines

- Use clear conventional-style subjects such as `feat: add order sync job` or `fix: align PNL rounding`.
- Group related changes per commit; avoid mixing schema, UI, and infra updates without explanation.
- PRs must include a concise summary, screenshots or recordings for UI changes, migration notes when Prisma schema shifts, and links to tracking issues.
- Ensure `npm run lint` and Prisma migrations succeed before requesting review; call out any follow-up work in the PR body.

## Environment & Security Notes

Define secrets in `.env.local` (`TIENDANUBE_CLIENT_ID`, `DATABASE_URL`, `NEXTAUTH_SECRET`). Never commit credentials—use Vercel project settings for shared deployments. Review `DEPLOYMENT.md` before promoting changes and rotate tokens immediately if exposure is suspected.
