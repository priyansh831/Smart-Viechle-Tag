import { Request, Response } from 'express';
import { db } from '../db.js';
import { processIncomingMessage, analyzeDamage } from '../services/geminiService.js';
import { broadcastNewAlert, broadcastAlertReply } from '../socket.js';
import { AuthRequest } from '../middleware/auth.js';

export async function submitAlert(req: Request, res: Response) {
  try {
    const { tagId } = req.params;
    const {
      message,
      language,
      imageBase64,
      bystanderName,
      bystanderContact,
      location
    } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const vehicle = await db.getVehicleByTag(tagId);
    if (!vehicle) {
      return res.status(404).json({ error: 'SmartTag not found.' });
    }

    const vehicleSummary = `${vehicle.year ? vehicle.year + ' ' : ''}${vehicle.make} ${vehicle.model} (${vehicle.color || 'Exterior'})`;
    const ownerLang = vehicle.preferredLanguage || 'en';

    // Run text analysis and optional vision analysis concurrently
    const [messageAnalysis, damageAnalysis] = await Promise.all([
      processIncomingMessage(message.trim(), ownerLang),
      imageBase64 ? analyzeDamage(imageBase64) : Promise.resolve(null)
    ]);

    // If damage was visually detected with Critical severity, elevate overall urgency
    let finalUrgency = messageAnalysis.urgency;
    if (damageAnalysis && damageAnalysis.hasDamage) {
      if (damageAnalysis.severity === 'Critical') {
        finalUrgency = 'CRITICAL';
      } else if (damageAnalysis.severity === 'Medium' && finalUrgency === 'LOW') {
        finalUrgency = 'MEDIUM';
      }
    }

    // Process optional geolocation data
    let cleanLocation: any = undefined;
    if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      cleanLocation = {
        latitude: Number(location.latitude.toFixed(6)),
        longitude: Number(location.longitude.toFixed(6)),
        accuracy: typeof location.accuracy === 'number' ? Math.round(location.accuracy) : undefined,
        address: location.address ? String(location.address).trim() : undefined
      };
    }

    const alertData = {
      tagId,
      ownerId: vehicle.ownerId || undefined,
      vehicleSummary,
      originalMessage: message.trim(),
      originalLanguage: messageAnalysis.detectedLanguage || language || 'auto',
      translatedMessage: messageAnalysis.translatedMessage,
      ownerLanguage: ownerLang,
      urgency: finalUrgency,
      intentCategory: messageAnalysis.intentCategory,
      actionAdvisory: messageAnalysis.actionAdvisory,
      location: cleanLocation,
      damageReport: damageAnalysis
        ? {
            hasImage: true,
            imageUrl: imageBase64,
            structuralImpact: damageAnalysis.structuralImpact,
            affectedParts: damageAnalysis.affectedParts,
            severity: damageAnalysis.severity,
            drivable: damageAnalysis.drivable,
            summary: damageAnalysis.summary
          }
        : {
            hasImage: false,
            severity: 'None',
            summary: 'No image attached.'
          },
      quickReplies: messageAnalysis.quickReplies,
      bystanderName: bystanderName ? bystanderName.trim() : 'Anonymous Bystander',
      bystanderContact: bystanderContact ? bystanderContact.trim() : '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const savedAlert = await db.createAlert(alertData);

    // Push real-time notification to owner's dashboard via WebSocket
    broadcastNewAlert(savedAlert);

    return res.status(201).json({
      success: true,
      message: 'Alert delivered to vehicle owner securely.',
      alertId: savedAlert._id || savedAlert.id,
      urgency: finalUrgency,
      intentCategory: messageAnalysis.intentCategory,
      damageAssessed: !!damageAnalysis,
      hasLocation: !!cleanLocation
    });
  } catch (error: any) {
    console.error('Error submitting bystander alert:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit alert' });
  }
}

export async function getAlerts(req: AuthRequest, res: Response) {
  try {
    const { tagId, urgency, all } = req.query;
    const ownerId = all === 'true' ? undefined : req.user?.userId;

    const alerts = await db.getAlerts(
      typeof tagId === 'string' ? tagId : undefined,
      typeof urgency === 'string' ? urgency : undefined,
      ownerId
    );
    return res.json({ alerts });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch alerts' });
  }
}

export async function respondToAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { replyMessage, status } = req.body;

    const alert = await db.getAlertById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updated = await db.updateAlert(id, {
      ownerReply: replyMessage || alert.ownerReply,
      ownerReplyTimestamp: new Date().toISOString(),
      status: status || 'ACKNOWLEDGED'
    });

    // Broadcast reply in real-time to bystander and dashboard
    broadcastAlertReply(updated);

    return res.json({
      success: true,
      message: 'Reply sent to bystander thread successfully',
      alert: updated
    });
  } catch (error: any) {
    console.error('Error responding to alert:', error);
    return res.status(500).json({ error: error.message || 'Failed to respond to alert' });
  }
}

export async function getAlertStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const alert = await db.getAlertById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.json({
      alertId: alert._id || alert.id,
      status: alert.status,
      ownerReply: alert.ownerReply,
      ownerReplyTimestamp: alert.ownerReplyTimestamp,
      createdAt: alert.createdAt
    });
  } catch (error: any) {
    console.error('Error fetching alert status:', error);
    return res.status(500).json({ error: error.message || 'Failed to check alert status' });
  }
}
