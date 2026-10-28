export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'CRITICAL';

export interface IDamageReport {
  hasImage: boolean;
  imageUrl?: string;
  structuralImpact?: string;
  affectedParts?: string[];
  severity?: 'None' | 'Low' | 'Medium' | 'Critical';
  drivable?: boolean | string;
  summary?: string;
  recommendations?: string;
}

export interface IGeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface IUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  preferredLanguage?: string;
  createdAt?: string;
}

export interface IVehicle {
  tagId: string;
  ownerId?: string;
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  ownerName: string;
  ownerPhoneMasked: string;
  preferredLanguage: string;
  emergencyNotes?: string;
  qrCodeUrl: string;
  createdAt: string;
}

export interface IPublicVehicle {
  tagId: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  maskedPlate: string;
  preferredLanguage: string;
  emergencyNotes?: string;
  ownerPhoneMasked: string;
}

export interface IAlert {
  _id?: string;
  id?: string;
  tagId: string;
  ownerId?: string;
  vehicleSummary: string;
  originalMessage: string;
  originalLanguage?: string;
  translatedMessage: string;
  ownerLanguage: string;
  urgency: UrgencyLevel;
  intentCategory: string;
  actionAdvisory?: string;
  location?: IGeoLocation;
  damageReport?: IDamageReport;
  quickReplies: string[];
  bystanderName?: string;
  bystanderContact?: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  ownerReply?: string;
  ownerReplyTimestamp?: string;
  createdAt: string;
}
