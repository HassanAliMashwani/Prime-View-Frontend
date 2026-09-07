export type AccountStatus = 'active' | 'suspended' | 'pending';
export type PaymentType = 'installment' | 'one_time';
export type PlotStatus = 'available' | 'reserved' | 'booked';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type DocumentType =
  | 'booking_confirmation'
  | 'payment_receipt'
  | 'booking_agreement'
  | 'installment_schedule'
  | 'applicant_photo'
  | 'cnic_copy'
  | 'nok_cnic_copy';

export type PlotCategory = 'residential' | 'commercial' | 'farm_house' | 'amenity';

export type FeeType =
  | 'admission_fee'
  | 'share_subscription_fee'
  | 'plot_installment'
  | 'plot_one_time';

export type BlockId =
  | 'abbott'
  | 'royal'
  | 'overseas'
  | 'elite'
  | 'chalet'
  | 'commercial'
  | 'npf-phase-1'
  | 'npf-phase-2';

export type PlotType =
  | '5_marla'
  | '7.5_marla'
  | '10_marla'
  | '13_marla'
  | '1_kanal'
  | '2_kanal'
  | '2_kanal_farm_house'
  | 'commercial_25x40'
  | 'commercial_30x50'
  | 'amenity_mosque'
  | 'amenity_park'
  | 'amenity_hospital'
  | 'amenity_school'
  | 'amenity_community'
  | string;

export interface Block {
  id: BlockId;
  name: string;
  description: string;
  totalPlots: number;
  amenities: string[];
}

export interface Customer {
  id: string;
  membershipNo: string;
  fullName: string;
  fatherOrHusbandName?: string;
  cnic: string;
  email: string;
  phone: string;
  mailingAddress: string;
  nokName: string;
  nokCnic: string;
  applicantPhotoUrl?: string;
  cnicCopyUrl?: string;
  nokCnicCopyUrl?: string;
  accountStatus: AccountStatus;
  createdDate: string;
  lastLogin?: string;
  passwordHash: string;
}

export interface Plot {
  id: string;
  blockId: BlockId | string;
  plotNumber: string;    // e.g. 'A-12', 'R-05', 'OV-08', 'AMN-01'
  size: string;          // Human-readable size e.g. '1 Kanal', '10 Marla'
  category: PlotCategory;
  plotType: PlotType;
  price: number;
  status: PlotStatus;
  currentOwnerId?: string;
  amenityName?: string;  // e.g. 'Community Mosque', 'Hospital' for amenity plots
  // Phase 2 Two-Layer Locking
  lockedBy?: string;     // adminId holding the lock
  lockedByName?: string; // admin name for live badge
  lockedAt?: number;     // timestamp in ms
  // Live Reserve Tracking (Non-blocking)
  reservingBy?: string;     // primary/latest adminId reserving
  reservingByName?: string; // admin name for live badge
  reservingAt?: number;     // timestamp in ms
  reservingUsers?: { adminId: string; adminName: string; timestamp: number }[];
  // Disputed counter claims tracking
  activeReservationCount?: number;
  isDisputed?: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  plotId: string;
  paymentType: PaymentType;
  status: 'active' | 'completed' | 'cancelled';
  bookingDate: string;
  confirmationDate?: string;
  paperInstallmentRef?: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  plotId: string;
  feeType: FeeType;
  installmentNumber?: number; // 1..N for installments; undefined for one-time
  dueDate: string;
  amount: number;
  paidAmount: number;
  paidDate?: string;
  status: PaymentStatus;
  transactionRef?: string;
}

export interface SocietyDocument {
  id: string;
  bookingId: string;
  plotId: string;
  type: DocumentType;
  fileName: string;
  uploadDate: string;
  fileSizeKb: number;
  mockFileUrl: string;
}

export interface MemberSession {
  customerId: string;
  role: 'customer';
  fullName: string;
  email: string;
  token: string;
  expiresAt: number;
}

// ── Admin Roles & Permissions (Phase 2 & Phase 3) ──
export type AdminRole = 'super_admin' | 'sub_admin';

export interface AdminPermissions {
  can_reserve: boolean;
  can_book: boolean;
  can_create_customer?: boolean;
  can_edit_content?: boolean;
}

export interface AdminUser {
  id: string;
  username: string; // e.g. 'admin', 'marketing', 'police'
  fullName: string;
  email: string;
  role: AdminRole;
  assignedBlocks: (BlockId | string)[]; // Empty/all for super_admin; specific blocks for sub_admin
  permissions: AdminPermissions;
  status: 'active' | 'suspended';
  passwordHash: string;
  createdDate: string;
  lastLogin?: string;
}

export interface AdminSession {
  adminId: string;
  username: string;
  fullName: string;
  role: AdminRole;
  assignedBlocks: (BlockId | string)[];
  permissions: AdminPermissions;
  token: string;
  expiresAt: number;
}

// ── Reservations (Sort Reservation, Phase 2) ──
export type ReservationStatus = 'active' | 'confirmed' | 'superseded' | 'expired' | 'cancelled';

export interface Reservation {
  id: string;
  plotId: string;
  plotNumber: string;
  blockId: BlockId | string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  tokenFee: number;
  validUntil: string;
  reservedByAdminId: string;
  reservedByAdminName: string;
  status: ReservationStatus;
  createdAt: string;
  confirmedAt?: string;
  confirmedByBookingId?: string;
  supersededAt?: string;
  supersededByBookingId?: string;
  cancelledAt?: string;
  cancelledByAdminId?: string;
  resolutionNote?: string;
}

// ── Content CMS (Phase 3) ──
export type ContentSection = 'plans' | 'events';

export interface ContentBlock {
  id: string;
  section: ContentSection;
  title: string;
  subtitle?: string;
  category?: string;
  content: string;
  metadata: {
    price?: number;
    size?: string;
    date?: string;
    location?: string;
    imageUrl?: string;
    featured?: boolean;
    tags?: string[];
    [key: string]: unknown;
  };
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  lockedBy?: string;
  lockedByName?: string;
  lockedAt?: number;
}

// ── Audit Trail (Phase 3) ──
export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: 'customer' | 'super_admin' | 'sub_admin';
  action: string;
  entityType: 'customer' | 'plot' | 'booking' | 'payment' | 'document' | 'content' | 'reservation' | 'lock' | 'sub_admin';
  entityId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

