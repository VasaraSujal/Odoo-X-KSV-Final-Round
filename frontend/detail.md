# Frontend Detail Map

This file explains the purpose of the main frontend files and folders in the `frontend` app. The project uses the Next.js App Router, so most pages are thin composition layers that assemble shared components, hooks, and services.

## High-Level Structure

- `app/` contains route entries, route-group layouts, and page composition.
- `components/` contains reusable UI, layout shells, dashboard blocks, forms, tables, charts, and domain components.
- `services/` contains API wrappers that call backend endpoints through the shared Axios client.
- `hooks/` contains reusable client hooks for auth, API state, page data, and dashboard data.
- `lib/` contains utility logic for formatting, auth helpers, finance helpers, query caching, validation helpers, and response parsing.
- `constants/` contains shared route maps, role names, navigation menus, API route strings, storage keys, and master data.
- `context/` contains React context for application-wide auth state.
- `utils/` contains browser/storage helpers.
- `public/` contains static assets.

## Main Entry And App Shell Files

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `app/layout.js` | Root HTML shell for the whole app. Sets metadata, loads the Google font, and wraps the app in shared providers. | `metadata`, `RootLayout`, `Providers`, global styles import |
| `app/page.js` | Home route. Shows the splash screen and lets auth state decide the next destination. | `HomePage`, `SplashScreen` |
| `middleware.js` | Edge middleware for route protection and role redirects. | protected-path check, admin/customer role redirect logic, auth-page redirect logic, `matcher` config |
| `components/common/Providers.js` | Global provider wrapper. | `AuthProvider`, `Toaster` |
| `components/common/RoleGuard.js` | Client-side auth and role gate used inside admin/customer layouts. | `useAuth`, redirect effects, loading/redirect placeholders |
| `components/common/SplashScreen.js` | Initial splash screen and startup redirect controller. | timed ready state, auth-based redirect, animated branding |
| `components/common/PageLoader.js` | Generic centered loading UI used by pages and guards. | `Loader`, label text, animation wrapper |

## Routing And Layouts

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `app/(auth)/layout.js` | Shared layout for login and register pages. Splits the screen into a marketing panel and form panel. | left branding panel, right form container, `Logo`, animated intro copy |
| `app/(auth)/login/page.js` | Login page route. Loads the login form lazily through `Suspense`. | `LoginForm`, `PageLoader` fallback |
| `app/(auth)/register/page.js` | Register page route. | `RegisterForm` |
| `app/admin/layout.js` | Admin area shell. Restores sidebar collapse state, prefetches lookup data, and wraps content with role protection. | `RoleGuard`, `Sidebar`, `Navbar`, `Footer`, sidebar collapse persistence, idle prefetch |
| `app/admin/page.js` | Admin dashboard page. Pulls dashboard data and assembles dashboard widgets. | `useDashboardData`, `Header`, `StatsGrid`, charts, recent activity, notifications |
| `app/customer/layout.js` | Customer area shell. Same structural idea as admin, but uses the customer sidebar and customer role gate. | `RoleGuard`, `CustomerSidebar`, `Navbar`, `Footer`, collapse persistence |
| `app/customer/page.js` | Customer dashboard page. Summarizes rental and payment status for the signed-in customer. | `rentalService`, `paymentService`, stat cards, quick actions, recent rentals |

## Shared Layout Components

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `components/layout/Sidebar.js` | Desktop and mobile admin sidebar. Renders navigation items and handles collapse/mobile overlay behavior. | `ADMIN_NAV`, animated aside, mobile backdrop, `NavItem`, `SidebarShell` |
| `components/layout/Navbar.js` | Top bar used in admin and customer areas. Shows the profile menu, logout action, and mobile menu button. | `useAuth`, `RoleBadge`, profile menu, logout handler, role-aware menu items |
| `components/layout/Header.js` | Standard page header for inner pages. Supports breadcrumbs, title, description, and action buttons. | `Breadcrumb`, title/description block, action slot |
| `components/layout/Footer.js` | Shared footer for authenticated areas. | footer content and metadata display |
| `components/layout/CustomerSidebar.js` | Customer-specific sidebar shell. Mirrors the admin sidebar with customer navigation. | customer navigation, collapse/mobile handling |
| `components/layout/PageContainer.js` | Page width and spacing wrapper used by inner pages. | layout container classes and page framing |
| `components/layout/Breadcrumb.js` | Breadcrumb trail renderer used by headers and page shells. | breadcrumb item list and link rendering |

## Dashboard Components

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `components/dashboard/ActivityCard.js` | Single timeline entry card used in dashboard activity lists. | icon/tone mapping, animated `motion.li`, title, description, time |
| `components/dashboard/ActivityTimeline.js` | Groups multiple activity cards into a timeline view. | timeline list composition |
| `components/dashboard/StatsGrid.js` | Grid of summary stat cards for dashboard overview metrics. | card layout, metric grouping |
| `components/dashboard/StatCard.js` | Reusable dashboard stat block. | value display, icon area, trend/tone styling |
| `components/dashboard/QuickActions.js` | Shortcuts for the most common admin actions. | quick action cards |
| `components/dashboard/RecentRentals.js` | Recent rental orders widget. | rental list rendering and loading states |
| `components/dashboard/RecentPayments.js` | Recent payment widget. | payment list rendering and loading states |
| `components/dashboard/VehicleStatusChart.js` | Vehicle status visualization for admin overview. | chart composition |
| `components/dashboard/RevenueAnalytics.js` | Revenue chart and trend analytics block. | chart data handling and summary display |
| `components/dashboard/PaymentAnalytics.js` | Payment method analytics widget. | breakdown visualization |
| `components/dashboard/RentalTrend.js` | Rental trend chart card. | time-series view |
| `components/dashboard/NotificationsPanel.js` | Operational notifications and alerts panel. | notification list |
| `components/dashboard/ErrorState.js` | Dashboard error fallback UI. | error message display and retry action |
| `components/dashboard/EmptyState.js` | Empty-state UI for dashboard cards. | placeholder illustration/text |

## Domain Component Folders

| Folder | What it contains |
| --- | --- |
| `components/forms/` | Login, register, filter, and image upload forms. |
| `components/master/` | Vehicle, category, and master-data screens used by admin CRUD pages. |
| `components/rental/` | Rental card, timeline, pricing, and info widgets for rental flows. |
| `components/finance/` | Payment, deposit, refund, receipt, and Stripe-related UI. |
| `components/reports/` | Report summary cards and export controls. |
| `components/operations/` | Pickup, return, inspection, penalty, and operations workflow components. |
| `components/profile/` | Profile and password management forms. |
| `components/settings/` | Application settings forms. |
| `components/tables/` | Generic data table building blocks. |
| `components/charts/` | Chart wrappers for bar, line, pie, area, and chart exports. |
| `components/ui/` | Base design-system primitives such as buttons, inputs, badges, modal, select, switch, textarea, checkbox, and logo. |

## Data And API Layer

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `services/axios.js` | Shared Axios instance and response interceptor logic. Handles auth headers, request caching, cache invalidation, and error handling. | request interceptor, cache lookup, response caching, 401/403 handling, redirect to login |
| `services/authService.js` | Auth-specific API wrapper. | login, register, logout, refreshProfile, changePassword |
| `services/vehicleService.js` | Vehicle API wrapper. | vehicle CRUD and list calls |
| `services/categoryService.js` | Category API wrapper. | category CRUD and lookup calls |
| `services/rentalService.js` | Rental order API wrapper. | rental order lists, details, and workflow calls |
| `services/paymentService.js` | Payment API wrapper. | payment CRUD and payment workflow calls |
| `services/securityDepositService.js` | Security deposit API wrapper. | deposit create/refund/detail calls |
| `services/reportsService.js` | Reports and analytics API wrapper. | report endpoints and exports |
| `services/dashboardService.js` | Dashboard data aggregator API wrapper. | summary widgets, analytics endpoints |
| `services/stripeService.js` | Stripe payment integration calls. | payment intent / checkout support |
| `services/userService.js` | User management API wrapper. | user profile and admin customer calls |
| `services/analyticsService.js` | Analytics API wrapper. | analytics data fetches |

## Hooks

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `hooks/useAuth.js` | Accessor for auth context. | `useContext(AuthContext)` and provider guard |
| `hooks/useApi.js` | Generic async helper for loading, success, and error state. | `execute`, `reset`, loading/error state |
| `hooks/useDashboardData.js` | Dashboard data fetch orchestration. | dashboard loading, refresh, and data normalization |
| `hooks/usePageData.js` | Shared page-data loading helper. | list/detail fetch coordination |
| `hooks/useReportExport.js` | Report export workflow helper. | export state and download logic |
| `hooks/useAnimatedCounter.js` | Animated numeric counter helper for stats. | counter interpolation |

## Auth And Shared Utilities

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `context/AuthContext.js` | Global auth state for user, token, role, login/logout, and session restore. | `AuthProvider`, restore flow, `login`, `logout`, `updateUser`, `refreshUser` |
| `lib/auth.js` | Auth and role helper functions. | display name helpers, initials, role checks, home-route resolution |
| `lib/apiResponse.js` | Normalizes API responses and extracts errors. | response parsing helpers |
| `lib/queryCache.js` | Small client-side request cache used by the Axios layer. | cache key building, freshness checks, invalidation |
| `lib/format.js` | Formatting helpers for dates, currency, and names. | display formatting functions |
| `lib/finance.js` | Finance-related business helpers. | payment/deposit calculations |
| `lib/rental.js` | Rental workflow helpers. | rental status and date helpers |
| `lib/reports.js` | Report transformation helpers. | report-friendly data shaping |
| `lib/stripe.js` | Stripe-specific frontend helpers. | payment flow helpers |
| `lib/toast.js` | Central toast notification helpers. | success/error/info wrappers |
| `lib/listUtils.js` | Shared list filtering/sorting helpers. | generic list operations |
| `lib/operations.js` | Operations workflow helpers. | pickup/return/inspection helpers |

## Constants And Configuration

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `constants/routes.js` | Central route registry for auth, admin, and customer pages. Also stores auth cookie names and route prefixes. | `APP_ROUTES`, `PROTECTED_PREFIXES`, `AUTH_COOKIE`, `ROLE_COOKIE` |
| `constants/navigation.js` | Sidebar menu definitions for admin and customer navigation. | `ADMIN_NAV`, `CUSTOMER_NAV`, icon mapping, menu labels |
| `constants/roles.js` | Role names and role helpers. | role constants |
| `constants/apiRoutes.js` | Frontend-to-backend endpoint map. | endpoint path constants |
| `constants/masterData.js` | Shared master-data values for forms and selects. | lookup arrays and labels |
| `constants/storageKeys.js` | Local storage key names used across the app. | key constants |

## Validation, UI, And Assets

| File | What it does | Main code parts inside |
| --- | --- | --- |
| `middleware.js` | Keeps protected routes behind auth and redirects users to the correct area based on role. | redirect rules and matcher |
| `app/globals.css` | Global styling, design tokens, and layout-level styles. | CSS variables, base styles, utility classes |
| `components/common/SkeletonLoader.js` | Reusable skeleton placeholder for loading states. | shape and pulse styling |
| `components/common/Loader.js` | Spinner/loading indicator primitive. | loading animation |
| `components/common/ButtonLoader.js` | Button-level loading indicator. | compact loader state |
| `components/common/ConfirmDialog.js` | Shared confirmation modal. | confirm/cancel flow |
| `components/ui/*` | Base UI primitives used everywhere else. | buttons, inputs, badges, modal, select, switch, textarea, checkbox |
| `public/` | Static files such as icons and other assets. | image and SVG assets |

## How The Pieces Fit Together

1. `app/layout.js` sets up the root shell and global providers.
2. `middleware.js` blocks unauthenticated access to protected routes and keeps roles in the correct area.
3. `context/AuthContext.js` restores the session and exposes auth state to the app.
4. `services/axios.js` injects the token, caches safe GET requests, and handles expired sessions.
5. Route layouts in `app/admin/`, `app/customer/`, and `app/(auth)/` assemble the correct shell around each page.
6. Page files mostly compose the domain components and call the relevant services or hooks.

## Notes

- Most page files are intentionally thin. The logic usually lives in the reusable components, services, hooks, and helpers listed above.
- `constants/routes.js` and `constants/navigation.js` are the main files to update when adding or moving routes.
- If you add a new feature area, follow the same pattern: route entry in `app/`, service in `services/`, helper logic in `lib/`, and UI in `components/`.