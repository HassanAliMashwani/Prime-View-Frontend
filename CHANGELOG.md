# Changelog — Prime View Frontend

## [P2-03] - 2026-09-23

### Added
- **Derived Disputed Display Status (Visual-only, no DB write):**
  - Added `displayStatus` and `displayStatusReason` optional fields to `Plot` interface (`src/lib/mock/types.ts`).
  - Created `src/lib/utils/displayStatus.ts` with client-side `resolveDisplayStatus` helper.
  - `InteractiveBlockMap.tsx`: All polygon fill, filter, tooltip, and badge logic now uses `plot.displayStatus || plot.status` (visual layer). Dispute tooltip text shows `plot.displayStatusReason` when set (exact string `"Disputed — customer account suspended"` for suspended-owner case).
  - `master-plan/[blockId]/page.tsx`: `filteredPlots` memoized filter, card grid status badge, card grid dispute note, drawer "Current Status" field, and new drawer Dispute Warning Banner all use `displayStatus` and `displayStatusReason`.
  - Drawer shows `(stored: <status>)` annotation when displayStatus differs from stored status.
- **Legend & SVG Hatch:**
  - Disputed SVG hatch pattern `#disputedHatch` already present — confirmed no regression.

### Unchanged (by design)
- `Plot.status` in the database is NEVER mutated by suspend/reinstate.
- Inventory overview, lock guards, and sweep continue to use stored `plot.status`.

---

## [P2-02] - 2026-09-22

### Changed
- **Reservation Hold Duration Default:**
  - Admin Reserve Plot dialog now defaults to 24 hours (`validDays: 1`).
  - Added helper note in the reserve dialog: "Default: 1 day (24h)".
  - Updated fallback reservation hold duration in `src/lib/dal/reservations.ts` from 7 days to 24 hours (`24 * 3600000` ms).
- **Remaining Hold Time UI:**
  - Added `formatRemainingHoldTime` utility (`src/lib/utils/reservationHold.ts`) computing remaining hours/minutes/days or expired state.
  - Displayed remaining hold time badge next to `Valid Until: <date>` on the Admin Reservations page (`/admin/reservations`).
  - Displayed remaining hold time badge in the Master Plan Drawer for each active reservation.
- **Outstanding Items:**
  - Documented OI-12: Plot A-01 dual booking dispute.
  - Documented OI-13: 5 extra booked plots without bookings.
