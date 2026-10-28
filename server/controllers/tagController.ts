import { Request, Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { db } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    // Standard Indian 10-digit mobile: 9876543210 -> +91 98*** *3210
    return `+91 ${digits.slice(0, 2)}*** *${digits.slice(-4)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    // Indian with country code: 919876543210 -> +91 98*** *3210
    const mob = digits.slice(2);
    return `+91 ${mob.slice(0, 2)}*** *${mob.slice(-4)}`;
  }
  if (digits.length <= 4) return '***-****';
  const last4 = digits.slice(-4);
  return `(***) ***-${last4}`;
}

export async function registerVehicle(req: AuthRequest, res: Response) {
  try {
    const {
      licensePlate,
      make,
      model,
      year,
      color,
      ownerName,
      ownerPhone,
      preferredLanguage,
      emergencyNotes
    } = req.body;

    if (!licensePlate || !make || !model || !ownerName || !ownerPhone) {
      return res.status(400).json({
        error: 'Missing required vehicle fields: licensePlate, make, model, ownerName, ownerPhone'
      });
    }

    // Generate unique cryptographically safe tag ID
    const randomHex = crypto.randomBytes(5).toString('hex');
    const tagId = `tag_${make.toLowerCase().replace(/[^a-z0-9]/g, '')}_${randomHex}`;

    // App URL or relative scan path
    const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/+$/, '') : '';
    const scanTargetUrl = appUrl ? `${appUrl}/scan/${tagId}` : `/scan/${tagId}`;

    // Generate High-Res QR code
    const qrCodeUrl = await QRCode.toDataURL(scanTargetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 480,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    // Hash phone for cryptographic verification, store only masked phone
    const ownerPhoneHash = crypto.createHash('sha256').update(ownerPhone.trim()).digest('hex');
    const ownerPhoneMasked = maskPhoneNumber(ownerPhone);

    const vehicleData = {
      tagId,
      ownerId: req.user?.userId || undefined,
      licensePlate: licensePlate.toUpperCase().trim(),
      make: make.trim(),
      model: model.trim(),
      year: year ? parseInt(year, 10) : undefined,
      color: color ? color.trim() : 'Unknown',
      ownerName: ownerName.trim(),
      ownerPhoneMasked,
      ownerPhoneHash,
      preferredLanguage: preferredLanguage || 'en',
      emergencyNotes: emergencyNotes ? emergencyNotes.trim() : '',
      qrCodeUrl,
      createdAt: new Date().toISOString()
    };

    const savedVehicle = await db.createVehicle(vehicleData);

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered and SmartTag generated successfully',
      vehicle: savedVehicle,
      scanUrl: scanTargetUrl
    });
  } catch (error: any) {
    console.error('Error registering vehicle:', error);
    return res.status(500).json({ error: error.message || 'Failed to register vehicle' });
  }
}

export async function getPublicVehicleInfo(req: Request, res: Response) {
  try {
    const { tagId } = req.params;
    const vehicle = await db.getVehicleByTag(tagId);

    if (!vehicle) {
      return res.status(404).json({ error: 'SmartTag not found or invalid' });
    }

    // Mask license plate to prevent identity harvesting (e.g. "ABC-1234" -> "***-1234")
    const plate = vehicle.licensePlate || '';
    const maskedPlate = plate.length > 4 ? `***-${plate.slice(-4)}` : '***';

    return res.json({
      tagId: vehicle.tagId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      maskedPlate,
      preferredLanguage: vehicle.preferredLanguage || 'en',
      emergencyNotes: vehicle.emergencyNotes || '',
      ownerPhoneMasked: vehicle.ownerPhoneMasked
    });
  } catch (error: any) {
    console.error('Error fetching public vehicle info:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch vehicle information' });
  }
}

export async function getOwnerVehicles(req: AuthRequest, res: Response) {
  try {
    const { all } = req.query;
    const ownerId = all === 'true' ? undefined : req.user?.userId;
    const vehicles = await db.getVehicles(ownerId);
    return res.json({ vehicles });
  } catch (error: any) {
    console.error('Error fetching owner vehicles:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve vehicles' });
  }
}

export async function deleteVehicle(req: Request, res: Response) {
  try {
    const { tagId } = req.params;
    await db.deleteVehicle(tagId);
    return res.json({ success: true, message: 'Vehicle tag deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete vehicle' });
  }
}
