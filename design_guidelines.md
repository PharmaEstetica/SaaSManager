# Design Guidelines for Financial SaaS Platform

## Design Approach
**Reference-Based Design** inspired by Cryptix's premium dark-mode financial interface. This approach leverages established patterns from modern fintech applications (Stripe, Plaid, Revolut) combined with Cryptix's sophisticated aesthetic to create a trustworthy, professional financial management experience.

## Visual Identity

### Color Palette
- **Primary Background**: Deep navy/dark blue (#0A0E27, #121828)
- **Secondary Background**: Slightly lighter panels (#1A1F3A, #1E2440)
- **Accent Primary**: Electric blue (#3B82F6, #2563EB) for CTAs and highlights
- **Accent Secondary**: Emerald green (#10B981, #059669) for positive values/growth
- **Alert Red**: Soft red (#EF4444) for negative values/alerts
- **Text Primary**: Near-white (#F9FAFB) for headings
- **Text Secondary**: Soft gray (#9CA3AF) for body text
- **Border/Divider**: Subtle dark borders (#2D3748, #374151)

### Typography
- **Primary Font**: Inter or Manrope (Google Fonts) - modern, highly legible
- **Headings**: 700 weight, tracking-tight
  - H1: 3xl-4xl (36-48px desktop)
  - H2: 2xl-3xl (24-36px)
  - H3: xl-2xl (20-24px)
- **Body**: 400-500 weight, base-lg (16-18px)
- **Data/Numbers**: 600 weight, tabular-nums for alignment
- **Small Text**: sm (14px) for labels, captions

### Spacing System
Use Tailwind spacing units: **4, 6, 8, 12, 16, 20** for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-20
- Card gaps: gap-6
- Sidebar width: w-64 (256px)

## Layout Architecture

### Sidebar Navigation (Fixed Left)
- Width: 256px, full-height, dark background
- Logo at top (p-6)
- Navigation items with icons (Heroicons): Dashboard, Transactions, Reports, Categories, Settings
- Active state: lighter background + accent border-left
- User profile/account selector at bottom
- Collapsible on mobile (hamburger menu)

### Main Content Area
- Left margin: ml-64 (to account for sidebar)
- Max-width container: max-w-7xl, mx-auto
- Padding: p-6 to p-8
- Background: slightly lighter than sidebar for depth

### Dashboard Layout (Grid-Based)
- **Top Stats Row**: 3-4 stat cards in grid (grid-cols-3 lg:grid-cols-4)
  - Total Balance, Monthly Expenses, Monthly Income, Savings Rate
  - Each card: rounded-xl, p-6, gradient background subtle
- **Charts Section**: 2-column layout (grid-cols-1 lg:grid-cols-2)
  - Spending by Category (Pie/Donut chart)
  - Monthly Trend (Line/Area chart)
- **Recent Transactions**: Full-width table below charts

### Weekly Table View
- 5-column grid for weeks (grid-cols-5, responsive to grid-cols-1 on mobile)
- Each week column: rounded-lg border, p-4
- Week header: text-sm font-semibold with week dates
- Transaction items stacked vertically within each column
- Visual indicators for status (Paid: green dot, Unpaid: orange dot)

## Component Library

### Cards
- Border: border border-gray-700/50
- Background: bg-gray-800/50 with subtle backdrop-blur
- Rounded: rounded-xl
- Shadow: shadow-lg for depth
- Hover: scale-[1.01] transition-transform

### Buttons
- Primary: bg-blue-600 text-white, rounded-lg, px-6 py-3, font-semibold
- Secondary: border border-gray-600, text-gray-200
- Ghost: text-gray-400 hover:text-white
- Icon buttons: p-2 rounded-md hover:bg-gray-700/50

### Form Inputs
- Background: bg-gray-800 border border-gray-600
- Focus: ring-2 ring-blue-500
- Rounded: rounded-lg
- Padding: px-4 py-3
- Labels: text-sm font-medium text-gray-300, mb-2

### Data Tables
- Header: bg-gray-800/70, text-xs uppercase tracking-wide text-gray-400
- Rows: border-b border-gray-700, hover:bg-gray-800/30
- Alternating: No alternating rows (use borders only)
- Padding: px-6 py-4

### Charts & Data Visualization
- Use Chart.js or Recharts with dark theme
- Colors: blue for expenses, green for income, purple for savings
- Grid lines: subtle gray (#374151)
- Tooltips: dark background with white text
- Smooth animations on load

### Status Badges
- Paid: bg-green-500/20 text-green-400 border border-green-500/30
- Unpaid: bg-orange-500/20 text-orange-400 border border-orange-500/30
- Rounded: rounded-full px-3 py-1 text-xs font-medium

## Interaction Patterns

### Animations (Subtle & Professional)
- Page transitions: fade-in with slight slide-up (20px)
- Card hovers: subtle scale (1.01-1.02) with smooth shadow increase
- Button clicks: slight scale-down (0.98) feedback
- Data updates: number counter animations for stats
- Chart reveals: stagger animation as data loads
- Modal overlays: backdrop blur with fade-in

### Transaction Management
- Click row to expand inline editor (accordion pattern)
- Quick action buttons (Edit, Delete) on row hover
- Modal for creating new transactions with form validation
- Drag-and-drop between categories (future enhancement)

### Category/Filter Management
- Tag-style display with × to remove
- Inline editing on click
- Color picker for custom category colors
- Drag to reorder priority

## Navigation & User Flow

### Account Mode Selection
- Modal on first login: "Choose Your Mode"
- Two large cards (Personal / Business) with icons and descriptions
- Can switch in Settings later
- Business mode shows additional fields (CNPJ, company name, payroll category)

### Reports Page
- Tab navigation: Overview, Comparison, Categories, Recommendations
- Date range selector (month picker) in header
- Export button (PDF/CSV) top-right
- Comparison view: side-by-side months with delta indicators (↑↓ arrows, %, absolute values)

## Responsive Behavior
- Desktop (1024px+): Full sidebar visible, multi-column layouts
- Tablet (768-1023px): Collapsible sidebar, 2-column grids reduce to 1
- Mobile (<768px): Hamburger menu, single-column stacked layout, sticky header with menu button

## Images
**No hero images needed** - this is a dashboard application. Use icon illustrations for:
- Empty states (no transactions yet, no categories created)
- Onboarding welcome screens
- Error/404 pages
Use Heroicons throughout for consistency.

## Trust & Credibility Elements
- Security badge in footer ("Bank-level encryption")
- Last updated timestamp on data displays
- Loading skeletons for async data (avoid spinners)
- Subtle success confirmations (toast notifications, green checkmarks)