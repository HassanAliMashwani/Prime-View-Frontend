# Member Portal Performance Audit

## Executive Summary
**Current Operational Status:** Fully connected to live NestJS backend (`/api/v1`) with JWT authentication, real-time ledger balance, and cloud-backed receipt submission.
**Optimizations Shipped:**
1. **Unconditional Focus/Visibility Refetching Removed:** The payments page no longer hard-toggles global `isLoading: true` on window focus or visibility change, preventing ledger skeleton flashes when users switch browser tabs or applications.
2. **Payment Progress Metric:** Re-engineered plan completion progress calculation (`paidAmount / agreedTotal`). It accurately displays 100% only when the remaining balance reaches 0.
3. **Instant Receipt Upload Feedback:** Form submission updates the member's list immediately with a `Sending` optimistic status and bottom-right feedback toast, asynchronously uploads to private storage, and updates status to `Pending` without artificial multi-second delays.
4. **Next of Kin & CNIC Formatting:** Strict 5-7-1 formatting enforced across member profile, registration, and receipt views.

## Route-by-Route Current Performance & Audit State

### Dashboard (`src/app/society-members/(portal)/dashboard/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | `GET /customers/profile`, `GET /plots/my`, `GET /payments/schedule` | Parallel via `Promise.all` | Member's plots, active schedules | Transient on cold load; cached | Shows member welcome banner, investment KPI stat cards, upcoming installment alerts, and direct payment CTAs. |

### Documents (`src/app/society-members/(portal)/documents/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | `GET /documents/my` | Single query | Member's documents | Non-blocking | Lists applicant photo, CNIC copy, Next of Kin CNIC, and system-generated society documents (booking confirmations, slips). |

### Payments & Ledger (`src/app/society-members/(portal)/payments/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | `GET /payments/schedule`, `GET /payments/history`, `GET /plots/my`, `GET /customers/profile`, `GET /receipts/customer/:id` | Consolidated parallel queries | All installment rows, receipt history | Skeleton on cold mount only | **Fixed (P0):** Background revalidation does not blank the table with a skeleton loader. |
| Upload Receipt | `POST /receipts` | Multipart / Stream to private storage | 1 receipt record | Optimistic status "Sending" -> "Pending" | **Fixed:** Submits photo as binary file to private receipts bucket; stores storage key; instantaneous notice displayed; form closes without 2.5s artificial freeze. |

### Payments History (`src/app/society-members/(portal)/payments/history/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | `GET /payments/history` | Scoped query | Transaction history | Fast cached render | Full audit of verified payment records, receipts, and allocation vouchers. |

### Profile (`src/app/society-members/(portal)/profile/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | `GET /customers/profile` | Single query | 1 member profile | Immediate | Displays full name, CNIC (formatted 5-7-1), Next of Kin (formatted 5-7-1), phone, email, and mailing address. |
| Save | `PUT /customers/profile` | Single mutation | 1 member record | Inline indicator | Allows member to update contact phone, email, and mailing address. |

### Properties (`src/app/society-members/(portal)/properties/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Open | `GET /plots/my` | Single query | Owned plots | Fast render | Cards display owned/booked plots with real payment progress bar, overdue indicators, and links to plot ledgers. |

### Member Login (`src/app/society-members/login/page.tsx`)
| Action | Requests fired | Duplication / Waterfall | Rows read / shown | Skeleton State | Current Status & Behavior |
|---|---|---|---|---|---|
| Submit | `POST /auth/customer/login` | Single mutation | 1 session JWT | Button spinner | Authenticates membership number / CNIC with bcrypt; enforces brute-force lockout; blocks suspended accounts with explanation. |

## Resolved Status Summary
*   **P0 Tab-switch skeleton flash on Payments page:** RESOLVED by removing aggressive global loading toggles on window focus/visibility events.
*   **P1 Multi-second artificial delay on receipt upload:** RESOLVED with immediate optimistic feedback, storage key assignment, and non-blocking background refreshes.
*   **P2 Inaccurate payment progress on dashboard:** RESOLVED by strictly comparing total paid amount vs total agreed plot amount.
