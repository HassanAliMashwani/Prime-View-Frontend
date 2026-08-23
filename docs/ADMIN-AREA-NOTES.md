# Admin Area Reconnaissance Notes — Prime View

Observations from authenticated reconnaissance of the WordPress Admin Dashboard.

> [!SECURITY]
> **Security Policy Compliance**: No actual login credentials (email or password) are recorded in this file. Credentials are stored strictly in `.env.local` via `PRIMEVIEW_ADMIN_EMAIL` and `PRIMEVIEW_ADMIN_PASSWORD`.

## Dashboard Reconnaissance Summary
- **CMS Environment**: WordPress Admin (`/wp-admin/`)
- **User Roles & Privileges**: Administrator level access confirmed.
- **Published Pages**: 12 total pages published. No hidden draft or private pages discovered in the backend.
- **Media Library**: 123 total media items stored under `/wp-content/uploads/` (categorized by year/month folders).
- **Plugins Installed**: Elementor, Astra Pro, Yoast SEO, LiteSpeed Cache, WPR Mega Menu.
- **Database / API Compatibility Considerations for Future Backend**:
  - Properties, payment plans, and team members are currently stored directly inside Elementor page json/post_content rather than custom post types.
  - Future admin panel should structure these into dedicated database models (Plots, PaymentPlans, TeamMembers, GalleryItems, LeadSubmissions).
