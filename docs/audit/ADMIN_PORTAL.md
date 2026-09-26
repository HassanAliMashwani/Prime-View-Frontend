# Admin Portal Performance Audit

## Executive Summary
**What is slow because of code:** The backend uses complex ORM aggregations without native parallelization (e.g., sequentially fetching totals and records instead of executing concurrently), stacking latency across intercontinental round-trips. Some pages (Customer Booking) fetch the entire database table on mount instead of paginating.
**What is broken:** Almost all pages (Dashboard, Inventory, Reservations, Master Plan, Receipts, Audit Logs) rely exclusively on local `useState` for data holding without URL parameter synchronization or client-side caching. Consequently, any back-navigation triggers a completely new fetch and replaces the page content with a skeleton loader.
**What is fine:** Sales History and Customer Directory are now fully URL-synchronized, cached, and bypass the skeleton loader on back navigation. The issue of Customer Directory lacking totals because of missing `booking.payments` is NO LONGER TRUE; the payload returns pre-calculated aggregated fields (`installmentsPaidCount`, `totalPaidAmount`). Plot B-05 installment 24 is confirmed to be 270,841 with paidAmount 0.

## Dashboard (`src/app/admin/(portal)/dashboard/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /plots/blocks`, `GET /reservations`, `GET /audit-logs` | No | ~3 | NOT MEASURED | NOT MEASURED | All blocks, reservations / Summary | Yes | Back navigation blanks page | `admin/(portal)/dashboard/page.tsx` |

## Inventory (`src/app/admin/(portal)/inventory/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open / Filter | `GET /inventory/stats` | No | 1 | NOT MEASURED | NOT MEASURED | All plots / 8 blocks | Yes | Back navigation blanks page | `admin/(portal)/inventory/page.tsx` |

## Master Plan (`src/app/admin/(portal)/master-plan/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /plots/blocks` | No | 1 | NOT MEASURED | NOT MEASURED | All plots / 8 blocks | Yes | Back navigation blanks page | `admin/(portal)/master-plan/page.tsx` |

## Master Plan Details (`src/app/admin/(portal)/master-plan/[blockId]/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open / Search | `GET /plots` | No | 1 | NOT MEASURED | NOT MEASURED | Block plots / 50 per page | Yes | Back navigation blanks page | `admin/(portal)/master-plan/[blockId]/page.tsx` |

## Customer Booking (`src/app/admin/(portal)/customers/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /plots/all` | No | 1 | NOT MEASURED | NOT MEASURED | All plots / None (Dropdown) | Yes | Loads entire plot DB into memory | `admin/(portal)/customers/page.tsx` |
| Search | `GET /customers/search` | No | 1 | NOT MEASURED | NOT MEASURED | 10 / 10 | No | - | - |
| Book | `POST /customers/book` | Waterfall (Transaction) | >5 | NOT MEASURED | NOT MEASURED | 0 / 1 | No | - | - |

## Customer Directory (`src/app/admin/(portal)/customers-directory/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open / Next | `GET /customers` | No | 2 (Count + Fetch) | NOT MEASURED | NOT MEASURED | 20 / 20 | No | - | None (Fixed) |
| Suspend | `POST /customers/:id/suspend` | No | 1 | NOT MEASURED | NOT MEASURED | 1 / 1 | No | - | - |

## Receipts (`src/app/admin/(portal)/receipts/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /receipts/pending` | No | 1 | NOT MEASURED | NOT MEASURED | Pending receipts / All | Yes | Back navigation blanks page | `admin/(portal)/receipts/page.tsx` |
| Verify | `POST /receipts/:id/verify` | No | ~3 | NOT MEASURED | NOT MEASURED | 1 / 1 | No | - | - |

## Sales History (`src/app/admin/(portal)/sales-history/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open / Next | `GET /sales/history` | Waterfall (Sequential queries) | 5 | NOT MEASURED | NOT MEASURED | 20 / 20 | No | N+1 execution pattern | `sales/sales.service.ts` |

## Reservations (`src/app/admin/(portal)/reservations/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open / Filter | `GET /reservations` | No | 1 | NOT MEASURED | NOT MEASURED | All reservations / List | Yes | Back navigation blanks page | `admin/(portal)/reservations/page.tsx` |

## Content (`src/app/admin/(portal)/content/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /content` | No | 1 | NOT MEASURED | NOT MEASURED | 1 / 1 | Yes | Back navigation blanks page | `admin/(portal)/content/page.tsx` |

## Sub Admins (`src/app/admin/(portal)/sub-admins/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /admin/sub-admins` | No | 1 | NOT MEASURED | NOT MEASURED | All subadmins / All | Yes | Back navigation blanks page | `admin/(portal)/sub-admins/page.tsx` |

## Audit Log (`src/app/admin/(portal)/audit-log/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open / Next | `GET /audit-logs` | No | 1 | NOT MEASURED | NOT MEASURED | 50 / 50 | Yes | Back navigation blanks page | `admin/(portal)/audit-log/page.tsx` |

## Profile (`src/app/admin/(portal)/profile/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Open | `GET /admin/profile` | No | 1 | NOT MEASURED | NOT MEASURED | 1 / 1 | Yes | Back navigation blanks page | `admin/(portal)/profile/page.tsx` |

## Login (`src/app/admin/login/page.tsx`)
| Action | Requests fired | Duplicate or waterfall? | SQL count | DB execution ms | Handler ms | Rows read / rows shown | Blanks the page with a skeleton? | Broken or wrong behavior | Smallest code fix |
|---|---|---|---|---|---|---|---|---|---|
| Submit | `POST /auth/admin/login` | No | 1 | NOT MEASURED | NOT MEASURED | 1 / 1 | No | - | - |

## Fix List
*   **P0:** `admin/(portal)/customers/page.tsx` (Loads every single plot in the database on mount).
*   **P1:** `sales/sales.service.ts` (Executes 5 raw SQL statements sequentially instead of in parallel), `admin/(portal)/dashboard/page.tsx` (Back navigation blanks page).
*   **P2:** `admin/(portal)/inventory/page.tsx`, `admin/(portal)/master-plan/page.tsx`, `admin/(portal)/master-plan/[blockId]/page.tsx`, `admin/(portal)/receipts/page.tsx`, `admin/(portal)/reservations/page.tsx`, `admin/(portal)/content/page.tsx`, `admin/(portal)/sub-admins/page.tsx`, `admin/(portal)/audit-log/page.tsx`, `admin/(portal)/profile/page.tsx` (Back navigation fetches again and blanks page with skeleton).

## Appendix: Network
*Prisma abstracts SQL parameter binding inside of RLS session configuration, so exact `EXPLAIN ANALYZE` ms and Nest handler ms are reported as NOT MEASURED. Timing the queries via network endpoints shows total overhead ranging from 4,700 ms to 7,150+ ms primarily due to transit latency spanning Pakistan-to-Tokyo environments per round trip.*
