import mongoose, { Schema } from 'mongoose';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'CRITICAL';

export interface IDamageReport {
  hasImage: boolean;
  imageUrl?: string;
  structuralImpact?: string;
  affectedParts?: string[];
  severity?: 'None' | 'Low' | 'Medium' | 'Critical';
  drivable?: boolean | string;
  summary?: string;
}

export interface IGeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface IAlert {
  tagId: string;
  ownerId?: string;
  vehicleSummary: string;
  originalMessage: string;
  originalLanguage?: string;
  translatedMessage: string;
  ownerLanguage: string;
  urgency: UrgencyLevel;
  intentCategory: string;
  actionAdvisory: string;
  location?: IGeoLocation;
  damageReport?: IDamageReport;
  quickReplies: string[];
  bystanderName?: string;
  bystanderContact?: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  ownerReply?: string;
  ownerReplyTimestamp?: Date;
  createdAt: Date;
}

export const AlertSchema = new Schema<IAlert>({
  tagId: { type: String, required: true, index: true },
  ownerId: { type: String, index: true },
  vehicleSummary: { type: String, required: true },
  originalMessage: { type: String, required: true },
  originalLanguage: { type: String, default: 'auto' },
  translatedMessage: { type: String, required: true },
  ownerLanguage: { type: String, required: true },
  urgency: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'CRITICAL'],
    default: 'LOW'
  },
  intentCategory: { type: String, default: 'GENERAL' },
  actionAdvisory: { type: String, default: '' },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    address: { type: String }
  },
  damageReport: {
    hasImage: { type: Boolean, default: false },
    imageUrl: { type: String },
    structuralImpact: { type: String },
    affectedParts: [{ type: String }],
    severity: { type: String, default: 'None' },
    drivable: { type: Schema.Types.Mixed, default: true },
    summary: { type: String }
  },
  quickReplies: [{ type: String }],
  bystanderName: { type: String },
  bystanderContact: { type: String },
  status: {
    type: String,
    enum: ['PENDING', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'PENDING'
  },
  ownerReply: { type: String },
  ownerReplyTimestamp: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export const AlertModel = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
