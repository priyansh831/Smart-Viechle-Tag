import { Router } from 'express';
import {
  registerVehicle,
  getPublicVehicleInfo,
  getOwnerVehicles,
  deleteVehicle
} from './controllers/tagController.js';
import {
  submitAlert,
  getAlerts,
  respondToAlert,
  getAlertStatus
} from './controllers/alertController.js';
import {
  signup,
  login,
  getMe,
  logout
} from './controllers/authController.js';
import { optionalAuth, requireAuth } from './middleware/auth.js';
import {
  polishAlertMessage,
  suggestOwnerReplies,
  testGeminiConnection
} from './services/geminiService.js';

const router = Router();

// Auth routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, getMe);
router.post('/auth/logout', logout);

// Vehicle Tag routes
router.post('/vehicles', optionalAuth, registerVehicle);
router.get('/vehicles', optionalAuth, getOwnerVehicles);
router.delete('/vehicles/:tagId', optionalAuth, deleteVehicle);
router.get('/tags/:tagId/public', getPublicVehicleInfo);

// Alert routes
router.post('/scan/:tagId/alert', submitAlert);
router.get('/alerts', optionalAuth, getAlerts);
router.post('/alerts/:id/reply', optionalAuth, respondToAlert);
router.get('/alerts/:id/status', getAlertStatus);

// Gemini AI Assistant routes
router.post('/ai/polish', async (req, res) => {
  try {
    const { text, tone } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required.' });
    }
    const result = await polishAlertMessage(text, tone || 'polite');
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to polish message' });
  }
});

router.post('/ai/suggest-reply', async (req, res) => {
  try {
    const { alertMessage, userInstruction, language } = req.body;
    if (!alertMessage || typeof alertMessage !== 'string') {
      return res.status(400).json({ error: 'alertMessage is required.' });
    }
    const replies = await suggestOwnerReplies(alertMessage, userInstruction, language || 'en');
    res.json({ success: true, replies });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to generate replies' });
  }
});

router.get('/ai/status', async (req, res) => {
  const result = await testGeminiConnection();
  res.json({
    geminiActive: result.connected,
    model: result.model,
    details: result.message
  });
});

export default router;

