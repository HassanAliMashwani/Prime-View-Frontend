# Member Portal Performance Audit

## Executive Summary
**What is slow because of code:** Data fetching via Zustand (`useMemberStore`) relies on multiple distinct requests (`fetchPayments`, `fetchPlots`, `fetchProfile`) fired concurrently or sequentially when it should ideally be consolidated. Furthermore, event listeners aggressively fire these fetch calls indiscriminately.
**What is broken:** The `payments` page unconditionally calls `fetchPayments()` on window `visibilitychange` and `focus` events. Because `fetchPayments()` hard-sets global `isLoading` to true, the UI is instantly replaced with a skeleton every time the user alt-tabs back to the portal.
**What is fine:** The login page properly authenticates. Plot B-05 installment 24 logic correctly reflects 270,841 with `paidAmount 0`.

## Dashboard (`src/app/society-members/(portal)/dashboard/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /customers/profile`, `GET /plots/my`, `GET /payments/schedule` | Parallel via `Promise.all` | ~3 | NOT MEASURED | NOT MEASURED | All plots, all schedules / Summary | Yes | Sets global isLoading | `lib/store/useMemberStore.ts` |

## Documents (`src/app/society-members/(portal)/documents/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /documents/my` | No | 1 | NOT MEASURED | NOT MEASURED | All docs / All | Yes | Sets global isLoading | `lib/store/useMemberStore.ts` |

## Payments (`src/app/society-members/(portal)/payments/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /payments/schedule`, `GET /payments/history`, `GET /plots/my`, `GET /customers/profile`, `GET /receipts/customer/:id` | Waterfall / Duplicate | 5 | NOT MEASURED | NOT MEASURED | All schedules, transactions / Tab | Yes | Focus/visibilitychange triggers fetch and blanks ledger | `society-members/(portal)/payments/page.tsx` |
| Upload | `POST /receipts/submit` | No | 1 | NOT MEASURED | NOT MEASURED | 0 / 1 | No | - | - |

## Payments History (`src/app/society-members/(portal)/payments/history/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /payments/history`, `GET /payments/schedule`, `GET /plots/my`, `GET /customers/profile` | Redundant fetch inside store | 4 | NOT MEASURED | NOT MEASURED | All history / Table | Yes | Sets global isLoading | `society-members/(portal)/payments/history/page.tsx` |

## Profile (`src/app/society-members/(portal)/profile/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /customers/profile` | No | 1 | NOT MEASURED | NOT MEASURED | 1 / 1 | No | - | - |
| Save | `PUT /customers/profile` | No | 1 | NOT MEASURED | NOT MEASURED | 0 / 1 | No | - | - |

## Properties (`src/app/society-members/(portal)/properties/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /plots/my` | No | 1 | NOT MEASURED | NOT MEASURED | All plots / Cards | No | Shared `isLoading` might trigger if another page fetches | `lib/store/useMemberStore.ts` |

## Login (`src/app/society-members/login/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Submit | `POST /auth/customer/login` | No | 1 | NOT MEASURED | NOT MEASURED | 1 / 1 | No | - | - |

## Fix List
*   **P0:** `society-members/(portal)/payments/page.tsx` (Focus and visibilitychange trigger `fetchPayments()`, setting global `isLoading: true` and replacing the ledger with a skeleton).
*   **P1:** `lib/store/useMemberStore.ts` (Global `isLoading` boolean used indiscriminately across all fetch operations blocks UI ungracefully; fetches should update cache transparently in the background).
*   **P2:** `society-members/(portal)/payments/history/page.tsx` (Calls full `fetchPayments` which aggregates redundant endpoints instead of a scoped history fetch).

## Appendix: Network
*Prisma abstracts SQL parameter binding inside of RLS session configuration, so exact `EXPLAIN ANALYZE` ms and Nest handler ms are reported as NOT MEASURED. Cross-continent latency affects TTFB significantly, exacerbating UI skeleton flashes when `isLoading` is toggled globally.*
