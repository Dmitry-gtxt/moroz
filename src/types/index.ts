// User types
export type UserRole = 'customer' | 'performer' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  email: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Performer types
export type PerformerType = 'ded_moroz' | 'snegurochka' | 'santa' | 'duo';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type EventFormat = 'home' | 'kindergarten' | 'school' | 'office' | 'corporate' | 'outdoor';

export interface PerformerProfile {
  id: string;
  userId: string;
  displayName: string;
  type: PerformerType[];
  photoUrls: string[];
  basePrice: number;
  priceFrom?: number;
  priceTo?: number;
  experienceYears: number;
  age?: number;
  description: string;
  costumeStyle?: string;
  formats: EventFormat[];
  districts: string[];
  videoGreetingUrl?: string;
  verificationStatus: VerificationStatus;
  ratingAverage: number;
  ratingCount: number;
  isActive: boolean;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

// District
export interface District {
  id: string;
  name: string;
  slug: string;
}

// Availability
export type SlotStatus = 'free' | 'booked' | 'blocked';

export interface AvailabilitySlot {
  id: string;
  performerId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

// Booking
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'not_paid' | 'prepayment_paid' | 'fully_paid' | 'refunded';

export interface Booking {
  id: string;
  customerId: string;
  performerId: string;
  slotId: string;
  status: BookingStatus;
  childrenInfo: string;
  eventType: EventFormat;
  address: string;
  district: string;
  comment?: string;
  priceTotal: number;
  prepaymentAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

// Review
export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  performerId: string;
  rating: number;
  text: string;
  createdAt: string;
  isVisible: boolean;
  customerName?: string;
  customerAvatar?: string;
}

// Chat
export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  recipientId: string;
  text: string;
  attachments?: string[];
  createdAt: string;
  readAt?: string;
}

// Verification Document
export type DocumentType = 'passport' | 'id_card' | 'other';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationDocument {
  id: string;
  performerId: string;
  type: DocumentType;
  documentUrl: string;
  status: DocumentStatus;
  adminComment?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

// Payout
export type PayoutStatus = 'pending' | 'processing' | 'paid';

export interface Payout {
  id: string;
  performerId: string;
  periodFrom: string;
  periodTo: string;
  amount: number;
  status: PayoutStatus;
  createdAt: string;
  paidAt?: string;
}

// Filters
export interface PerformerFilters {
  district?: string;
  date?: string;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
  priceFrom?: number;
  priceTo?: number;
  performerType?: PerformerType[];
  eventFormat?: EventFormat[];
  hasVideo?: boolean;
  minRating?: number;
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'reviews';
}
