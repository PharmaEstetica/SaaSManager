# Financial SaaS Platform - Cryptix Inspired

## Overview
Comprehensive financial management platform with premium dark-mode design inspired by Cryptix. Supports both Personal and Business (PJ) financial management modes with advanced transaction management, recurring expenses, customizable categories, innovative weekly view, and comparative reports with charts.

**Current State**: Full MVP implementation complete with frontend-backend integration, authentication, and all core features operational.

## Recent Changes (November 16, 2025)
- **CRITICAL FIX - Authentication Routes**: Created missing `server/replitAuth.ts` file with complete Replit Auth OIDC setup
  - Fixed 404 errors on `/api/login`, `/api/callback`, `/api/logout`
  - Added `isAuthenticated` middleware for protected routes
  - Implemented `upsertUser` function in storage for auth flow
  - All navigation now works without 404 errors (verified via E2E tests)
- **Task 3 Integration Complete**: All pages migrated to backend API endpoints
  - Dashboard → `/api/reports/advanced`
  - Reports → `/api/reports/advanced`
  - Weekly View → `/api/reports/weekly`
- **Month Alignment Fixed**: Resolved all 0-based vs 1-based month calculation issues using robust Date constructor
- **Type Safety**: Added TypeScript interfaces (AdvancedReport, WeeklyData, CategoryRanking, MonthlyReport) to shared/schema.ts
- **Loading States**: Implemented Skeleton components across all pages
- **Security Hardened**: Backend validates and omits userId, isRecurring, recurrenceType, recurrenceDay from PATCH payloads

## Project Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Wouter (SPA routing)
- **Backend**: Express + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (Replit built-in)
- **UI**: Shadcn/UI + Tailwind CSS + Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query (React Query v5)
- **Auth**: Replit Auth (OIDC)

### Design System
**Color Palette** (Cryptix-inspired premium dark mode):
- Primary: Deep Navy `#0A0E27` / `#121828`
- Accent: Emerald `#10B981`
- Interface: Portuguese language
- Design Patterns: Modern fintech with professional dark theme

### Key Features
1. **Dual Account Modes**: Personal / Business (PJ) management
2. **Transaction Management**:
   - Full CRUD operations
   - Recurring expenses (monthly, weekly, biweekly, variable amounts)
   - Multi-month automatic backfill for recurring transactions
   - Category-based organization with custom colors
3. **Innovative Weekly View**: Week 1-5 display inspired by spreadsheet layout
4. **Advanced Reports**:
   - Month-over-month comparisons with percentage changes
   - Category ranking and analysis
   - Monthly evolution charts (last 6 months)
   - AI-powered recommendations
5. **Professional Interface**:
   - Responsive sidebar navigation
   - Animated cards and transitions
   - Skeleton loading states
   - Error handling with toast notifications

## Data Model (shared/schema.ts)

### Core Tables
- **users**: User profiles with account mode (personal/business)
- **categories**: Customizable categories with colors (expense/income/both)
- **transactions**: Financial transactions with recurring support
  - Fields: title, amount, date, category, status (paid/pending), notes
  - Recurrence: isRecurring, recurrenceType (monthly/weekly/biweekly/none), recurrenceDay
- **account_settings**: User preferences and settings

### TypeScript Interfaces
- `AdvancedReport`: Dashboard/Reports comprehensive data structure
- `WeeklyData`: Weekly view aggregated data
- `CategoryRanking`: Category comparison with change percentages
- `MonthlyReport`: Individual month report data

## API Endpoints (server/routes.ts)

### Categories
- `GET /api/categories` - List user categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Transactions
- `GET /api/transactions` - List all transactions (includes auto-generated recurring)
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:id` - Update transaction (security: omits sensitive fields)
- `DELETE /api/transactions/:id` - Delete transaction

### Reports
- `GET /api/reports/advanced?month=X&year=Y` - Comprehensive report with category rankings, month comparisons, totals
- `GET /api/reports/weekly?month=X&year=Y` - Weekly breakdown with transactions grouped by week

### Account Settings
- `GET /api/account-settings` - Get user settings
- `POST /api/account-settings` - Create settings
- `PATCH /api/account-settings/:id` - Update settings

### Authentication
- `GET /api/login` - Start Replit Auth OIDC login flow
- `GET /api/callback` - OIDC callback (auto-redirects to /)
- `GET /api/logout` - Logout user and redirect
- `GET /api/auth/user` - Get current authenticated user (protected)

## Frontend Pages (client/src/pages/)

### Navigation Structure
- **Landing Page**: Elegant welcome for unauthenticated users
- **Dashboard**: Statistics cards, charts, category breakdown
- **Transactions**: Full CRUD with filters and search
- **Weekly View**: Week 1-5 layout with transaction details
- **Reports**: Comparative analysis with visualizations
- **Categories**: Manage custom categories
- **Settings**: Account preferences and configuration

### Key Implementation Details
- All forms use Shadcn Form + useForm + zodResolver
- All data fetching uses React Query with proper loading/error states
- SPA routing via Wouter (Link component with href prop)
- data-testid attributes on all interactive elements
- Month calculations use robust Date constructor for automatic rollover

## Recurring Transactions Logic

### Backend Implementation (server/storage.ts)
1. **Storage**: Base recurring transactions stored with `isRecurring=true`
2. **Generation**: `getTransactionsForUser()` auto-generates instances for current month
3. **Backfill**: `backfillRecurringTransactions()` generates instances for past months
4. **Frequency Support**:
   - Monthly: Repeats on same day each month
   - Weekly: Every 7 days
   - Biweekly: Every 14 days
   - Variable amounts: Monthly recurrence with different amounts each occurrence

### Security
- PATCH endpoints validate and strip userId, isRecurring, recurrenceType, recurrenceDay
- Users can only access their own data
- All mutations use Zod schema validation

## Development Workflow

### Running the Project
```bash
npm run dev  # Starts Express + Vite on port 5000
```

### Database Operations
```bash
npm run db:push        # Sync schema to database
npm run db:push --force # Force sync if needed (safe for schema changes)
```

### Key Files
- `shared/schema.ts` - Data models and TypeScript types
- `server/storage.ts` - Database interface and business logic (includes upsertUser for auth)
- `server/routes.ts` - API endpoints with Zod validation
- `server/replitAuth.ts` - Replit Auth OIDC configuration (login/logout/callback routes)
- `design_guidelines.md` - UI/UX design specifications
- `client/src/lib/queryClient.ts` - React Query configuration

## User Preferences
- Interface language: Portuguese (pt-BR)
- Design philosophy: Premium dark mode with subtle animations
- Code style: TypeScript strict mode, functional components, comprehensive error handling

## Current Status
✅ All 3 main tasks completed and architect-approved:
1. Schema & Frontend - Complete
2. Backend & API - Complete  
3. Integration & Polish - Complete

**Application State**: Production-ready MVP with all core features functional, type-safe, and thoroughly tested.
