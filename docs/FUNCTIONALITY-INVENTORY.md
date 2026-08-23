# Functionality Inventory — Prime View

Complete audit of interactive site components, form handlers, and backend endpoints.

> [!NOTE]
> **Export Verification Note**: Corrected via WP export (2026-08-22) using extracted WordPress database (`database.sql`) and plugin configurations.

## 1. Contact Form Builder (`ContactForm.tsx`)
- **Live Form Handler**: Royal Elementor Addons Form Builder (`wpr-addons`)
- **Submission Endpoint**: `/wp-admin/admin-ajax.php` (AJAX POST)
- **Form Actions**:
  - `action`: `wpr_addons_form_builder_submit`
  - `form_id`: `wpr_contact_form`
- **Form Fields**:
  1. `Your Name` (`text`, required)
  2. `Number` (`tel`/`text`, required)
  3. `Message` (`textarea`, optional)
- **Client Submission Response**:
  - Displays element: `<div class="wpr-form-message wpr-form-message-success">`
  - Success Message Text: *"We respond to all messages within 2 hours."*
- **Recreation Implementation**:
  - `ContactForm.tsx` captures inputs, sends structured payload, and displays exact success banner and response notification.

## 2. Navigation & Header Dropdowns (`Header.tsx`)
- **Our Team Dropdown**:
  - Managing Committee & owners (`/owners`)
  - Marketing & Sales Partner (`/marketing-sales-partner`)
  - Society Members (`/society-members`)
  - Legal Team (`/legal-team`)
- **Maps Dropdown**:
  - Location Map (`/map`)
  - Masterplan Layout (`/map-2`)

## 3. Direct Contact Triggers
- **Helpline Button**: `tel:0333-01-111-12`
- **WhatsApp Direct Booking**: `https://wa.me/923330111112`
- **Email Contact Links**: `mailto:info@primeview.pk`, `mailto:Chairman@primeview.pk`, etc.
