# Changelog — Prime View Frontend

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
