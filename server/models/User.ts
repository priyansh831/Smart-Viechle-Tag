import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  password: string;
  fullName?: string;
  preferredLanguage?: string;
  createdAt: Date;
}

export const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  preferredLanguage: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
