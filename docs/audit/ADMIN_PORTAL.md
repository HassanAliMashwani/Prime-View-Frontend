# Admin Portal Performance Audit

## Executive Summary
**Current Operational Status:** Fully integrated with real NestJS backend on Render and PostgreSQL on Supabase. Major performance bottlenecks and state-loss issues identified in initial audits have been resolved.
**Optimizations Shipped:**
1. **Customer Booking Query:** Autocomplete/search query replaces full table scans; only available, in-scope plots are queried on demand.
2. **Receipts Desk:** List query (`GET /receipts`) is text-only without heavy base64/photo URLs; images are loaded on demand via "View Bank Slip Image". Instant optimistic UI approval with bottom-right notification feedback and composite index `(status, uploadedAt)`.
3. **Audit Log Listing:** `oldValue` and `newValue` JSON diffs are omitted from list queries (`GET /admin/audit-logs`) and loaded on demand via `GET /admin/audit/:id`.
4. **Sales History & Customer Directory:** Fully URL-synchronized with pagination, server-side search, and pre-calculated aggregates (`installmentsPaidCount`, `totalPaidAmount`).
5. **Back-Navigation & Hydration:** Cache and store hydration guards prevent skeleton flicker on back-navigation across key portals.

## Route-by-Route Current Performance & Audit State

### Dashboard (`src/app/admin/(portal)/dashboard/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | `GET /inventory/stats`, `GET /reservations`, `GET /audit-logs` | Parallel via DAL | Real database counts (7 active blocks) | Transient on cold load; cached on back | Live inventory counts (sum of visible blocks); sample months removed from chart; Chalet consolidated into Elite. |

### Inventory Overview (`src/app/admin/(portal)/inventory/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Filter | `GET /inventory/stats` | Single query | 7 active blocks | Fast load, cached | 4-column layout (Available, Reserved, Booked, Allotted); Disputed rendered as footnote; numbers match database rows 1:1. |

### Master Plan (`src/app/admin/(portal)/master-plan/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | `GET /blocks` | Single query | 7 active blocks | Cached on revisit | Cards show active blocks without duplicate dispute counter; direct link to interactive map. |

### Master Plan Block Detail (`src/app/admin/(portal)/master-plan/[blockId]/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / View Map | `GET /plots?blockId=:id` | Scoped by block | Plots in block | Skeleton on mount | SVG interactive map rendered; derived disputed status active for suspended owners; allotted plots hide adjustment/reservation options. |

### Customer Booking (`src/app/admin/(portal)/customers/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | Scoped available search | On-demand search | Paginated / Filtered | No blanking | **Fixed (P0):** Full table scan eliminated. Sub-admin fast booking (Name, CNIC 5-7-1, City) supported; police sub-admin booking block issue resolved. |
| Search Plot | `GET /plots/search?q=...` | Debounced | Up to 20 matches | Search dropdown | Only available, in-scope plots returned. |
| Submit Booking | `POST /customers/book` | Atomic `$transaction` | 1 booking + records | Instant feedback | Locks plot, flips status to booked, writes audit entry. |

### Customer Directory (`src/app/admin/(portal)/customers-directory/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Page | `GET /customers?page=&pageSize=20` | Count + Fetch | 20 / page | URL-synced | Shows registration status; Complete Registration deep-links with pre-filled plot; safe delete checks active bookings/payments. |
| Suspend / Reinstate | `POST /customers/:id/suspend` | Single mutation | 1 customer | In-place update | Toggles suspension; derived disputed status reflected on maps. |

### Receipts Desk (`src/app/admin/(portal)/receipts/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Filter | `GET /receipts?page=1` | Single query | 20 / page | Non-blanking filter | **Fixed:** Text fields only (no base64 photos); index on `(status, uploadedAt)`. Click on "View Bank Slip Image" loads image. |
| Verify | `POST /receipts/:id/verify` | Atomic `$transaction` | 1 receipt + allocation | Instant optimistic row update | Generates verified slip with SHA-256 hash and QR verification URL; triggers `maybeAllotIfFullyPaid`. |

### Sales History (`src/app/admin/(portal)/sales-history/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Page | `GET /sales/history?page=&pageSize=20` | Parallel aggregation | 20 / page | URL-synced | Aggregates sales KPIs and transactions without sequential N+1 query overhead. |

### Reservations Desk (`src/app/admin/(portal)/reservations/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Filter | `GET /reservations` | Single query | All active reservations | URL-synced | 24-hour default hold duration; countdown timer badge; automated 60s sweep expiration. |

### Content CMS (`src/app/admin/(portal)/content/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Edit | `GET /content`, `PUT /content/:id` | Single query | Plan / Event blocks | Cached | Content persistence verified; 7.5 Marla and all official sizes saved and reflected on public site. |

### Sub Admins (`src/app/admin/(portal)/sub-admins/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Edit | `GET /admin/sub-admins`, `PUT` | Single query | Sub-admin records | Immediate | Super Admin exclusive; 10 permission toggles; block assignment picker for 7 active blocks; username/profile editable. |

### Audit Log (`src/app/admin/(portal)/audit-log/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Next | `GET /admin/audit-logs?page=` | Single query | 20 / page | URL-synced | **Optimized:** `oldValue`/`newValue` excluded from list response; `hasDiff` boolean flag; full diff retrieved via `GET /admin/audit/:id`. |

### Admin Profile (`src/app/admin/(portal)/profile/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open / Save | `GET /auth/me`, `PUT /admin/profile` | Single query | 1 admin record | Immediate | Self-service profile updates (username, full name, phone, avatar picture); permissions list displayed cleanly. |

## Resolved Status Summary
*   **P0 Full plot load on Customer Booking:** RESOLVED with scoped query and debounced autocomplete.
*   **P0 Receipt list photo payload:** RESOLVED with text-only list, on-demand slip loading, and `(status, uploadedAt)` index.
*   **P1 Audit log heavy diff payload:** RESOLVED with list payload omitting diffs and dedicated single-item diff endpoint.
*   **P1 Police sub-admin booking block:** RESOLVED by fixing block scope and customer creation permission handoff.
*   **P2 Back navigation skeleton flashes:** RESOLVED with client DAL cache layer (`apiCache.ts`) and URL state preservation.
