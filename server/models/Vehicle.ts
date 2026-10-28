import mongoose, { Schema } from 'mongoose';

export interface IVehicle {
  tagId: string;
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  ownerName: string;
  ownerPhoneMasked: string;
  ownerPhoneHash?: string;
  ownerId?: string;
  preferredLanguage: string;
  emergencyNotes?: string;
  qrCodeUrl: string;
  createdAt: Date;
}

export const VehicleSchema = new Schema<IVehicle>({
  tagId: { type: String, required: true, unique: true, index: true },
  licensePlate: { type: String, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number },
  color: { type: String },
  ownerName: { type: String, required: true },
  ownerPhoneMasked: { type: String, required: true },
  ownerPhoneHash: { type: String },
  ownerId: { type: String, index: true },
  preferredLanguage: { type: String, default: 'en' },
  emergencyNotes: { type: String, default: '' },
  qrCodeUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const VehicleModel = mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema);
