import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { IVehicle, VehicleModel } from './models/Vehicle.js';
import { IAlert, AlertModel } from './models/Alert.js';
import { IUser, UserModel } from './models/User.js';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'smarttag_store.json');

let isMongoConnected = false;

interface LocalStore {
  vehicles: any[];
  alerts: any[];
  users: any[];
}

const localStore: LocalStore = {
  vehicles: [],
  alerts: [],
  users: []
};

// Seed initial vehicles and demo user if none exist
async function initSeedData() {
  if (localStore.users.length === 0) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const demoUser = {
      _id: 'user_priyansh_gupta',
      username: 'priyansh_driver',
      email: 'priyanshg753@gmail.com',
      password: hashedPassword,
      fullName: 'Priyansh Gupta',
      preferredLanguage: 'hi',
      createdAt: new Date().toISOString()
    };
    localStore.users.push(demoUser);
    saveLocalStore();
  }

  // Check if we already have Indian vehicles, or if we need to initialize them
  const hasIndianSeed = localStore.vehicles.some(v => v.licensePlate && (v.licensePlate.startsWith('DL') || v.licensePlate.startsWith('MH') || v.licensePlate.startsWith('KA')));
  if (localStore.vehicles.length === 0 || !hasIndianSeed) {
    localStore.vehicles = [];
    localStore.alerts = [];

    const tag1 = 'tag_tata_dl08ca4321';
    const qr1 = await QRCode.toDataURL(`/scan/${tag1}`, {
      margin: 1,
      width: 320,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const tag2 = 'tag_mahindra_mh02er9000';
    const qr2 = await QRCode.toDataURL(`/scan/${tag2}`, {
      margin: 1,
      width: 320,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const tag3 = 'tag_enfield_ka03hm1947';
    const qr3 = await QRCode.toDataURL(`/scan/${tag3}`, {
      margin: 1,
      width: 320,
      color: { dark: '#000000', light: '#ffffff' }
    });

    localStore.vehicles.push({
      tagId: tag1,
      ownerId: 'user_priyansh_gupta',
      licensePlate: 'DL 08 CA 4321',
      make: 'Tata Motors',
      model: 'Nexon EV Empowered+',
      year: 2024,
      color: 'Daytona Grey',
      ownerName: 'Priyansh Gupta',
      ownerPhoneMasked: '+91 98*** *4321',
      ownerPhoneHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
      preferredLanguage: 'hi',
      emergencyNotes: 'High Voltage EV. Frunk charging port. Fastag & HSRP installed.',
      qrCodeUrl: qr1,
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 4).toISOString()
    });

    localStore.vehicles.push({
      tagId: tag2,
      ownerId: 'user_priyansh_gupta',
      licensePlate: 'MH 02 ER 9000',
      make: 'Mahindra',
      model: 'Thar 4x4 Hardtop',
      year: 2023,
      color: 'Napoli Black',
      ownerName: 'Priyansh Gupta',
      ownerPhoneMasked: '+91 98*** *4321',
      ownerPhoneHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
      preferredLanguage: 'hi',
      emergencyNotes: 'Offroad tow-hooks front and rear. Rooftop tent attached.',
      qrCodeUrl: qr2,
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString()
    });

    localStore.vehicles.push({
      tagId: tag3,
      ownerId: 'user_priyansh_gupta',
      licensePlate: 'KA 03 HM 1947',
      make: 'Royal Enfield',
      model: 'Classic 350 Reborn',
      year: 2024,
      color: 'Halcyon Black',
      ownerName: 'Priyansh Gupta',
      ownerPhoneMasked: '+91 98*** *4321',
      ownerPhoneHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
      preferredLanguage: 'en',
      emergencyNotes: 'Handle lock engaged. Disc lock on front wheel.',
      qrCodeUrl: qr3,
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString()
    });

    // Seed authentic Indian alerts
    localStore.alerts.push({
      _id: 'alert_ind_1',
      tagId: tag1,
      ownerId: 'user_priyansh_gupta',
      vehicleSummary: '2024 Tata Motors Nexon EV Empowered+ (Daytona Grey)',
      originalMessage: 'Bhaiya aapki Nexon EV DLF Cyber City Tower B gate ke saamne khadi hai, delivery van block ho rahi hai. Please thoda aage badha lijiye.',
      originalLanguage: 'Hinglish / Hindi',
      translatedMessage: 'Brother, your Nexon EV is parked right in front of DLF Cyber City Tower B gate and blocking the delivery van. Please move it forward slightly.',
      ownerLanguage: 'hi',
      urgency: 'MEDIUM',
      intentCategory: 'PARKING_BLOCK',
      actionAdvisory: 'Vehicle is obstructing building commercial delivery bay at DLF Cyber City. Move forward 10 meters.',
      location: {
        latitude: 28.4950,
        longitude: 77.0895,
        accuracy: 8,
        address: 'Tower B Gate, DLF Cyber City Phase 2, Gurugram, Haryana'
      },
      damageReport: {
        hasImage: false,
        severity: 'None',
        summary: 'No collision or damage reported.'
      },
      quickReplies: [
        'Haan bhaiya, bas 2 minute mein aa raha hoon!',
        'Maafi chahta hoon, emergency call pe tha. Abhi move karta hoon.',
        'Guard sahab ko key di hai, woh move kar rahe hain.'
      ],
      bystanderName: 'Suraj Pal (Society Security)',
      bystanderContact: '',
      status: 'ACKNOWLEDGED',
      ownerReply: 'Haan bhaiya, bas 2 minute mein aa raha hoon!',
      ownerReplyTimestamp: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    });

    localStore.alerts.push({
      _id: 'alert_ind_2',
      tagId: tag2,
      ownerId: 'user_priyansh_gupta',
      vehicleSummary: '2023 Mahindra Thar 4x4 (Napoli Black)',
      originalMessage: 'Mumbai Traffic Police crane has reached Linking Road near Bandra! They are towing vehicles parked near the bus stop. Please move your Thar immediately!',
      originalLanguage: 'English',
      translatedMessage: 'ट्रैफिक पुलिस की टोइंग क्रेन लिंकिंग रोड पर आ गई है और बस स्टॉप के पास खड़ी गाड़ियां उठा रही है! अपनी थार तुरंत हटा लें!',
      ownerLanguage: 'hi',
      urgency: 'CRITICAL',
      intentCategory: 'TOWING_RISK',
      actionAdvisory: 'Urgent towing alert by Mumbai Traffic Police. Relocate vehicle immediately to designated parking to avoid challan.',
      location: {
        latitude: 19.0596,
        longitude: 72.8295,
        accuracy: 12,
        address: 'Near KFC, Linking Road, Bandra West, Mumbai, Maharashtra'
      },
      damageReport: {
        hasImage: false,
        severity: 'None',
        summary: 'Towing vehicle alert in progress.'
      },
      quickReplies: [
        'Thank you so much brother! Running down now.',
        'Bhai guard ko bolna ruko 1 min, aa raha hoon!',
        'Thanks for alerting, moving right away!'
      ],
      bystanderName: 'Rohit Deshmukh',
      bystanderContact: '',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    });

    localStore.alerts.push({
      _id: 'alert_ind_3',
      tagId: tag1,
      ownerId: 'user_priyansh_gupta',
      vehicleSummary: '2024 Tata Motors Nexon EV Empowered+ (Daytona Grey)',
      originalMessage: 'Namaste ji, Connaught Place mein tez monsoon barish start ho gayi hai aur aapki gaadi ka passenger window adha khula hai. Paani andar seat par jaa raha hai.',
      originalLanguage: 'Hindi',
      translatedMessage: 'Greetings, heavy monsoon rain has started in Connaught Place and your car passenger window is rolled halfway down. Rainwater is soaking the front seat.',
      ownerLanguage: 'hi',
      urgency: 'MEDIUM',
      intentCategory: 'VEHICLE_ISSUE',
      actionAdvisory: 'Rain entering cabin at Connaught Place parking. Close window via Tata iRA connected app or in person.',
      location: {
        latitude: 28.6315,
        longitude: 77.2167,
        accuracy: 10,
        address: 'Block C Inner Circle Parking, Connaught Place, New Delhi'
      },
      damageReport: {
        hasImage: false,
        severity: 'Low',
        summary: 'Cabin window partially rolled down during heavy rain.'
      },
      quickReplies: [
        'Bahut shukriya batane ke liye! App se band kar raha hoon.',
        'Bas aa raha hoon, thanks a lot bhai!',
        'Valet ko bhej raha hoon window close karne.'
      ],
      bystanderName: 'Ankit Mehra',
      bystanderContact: '',
      status: 'ACKNOWLEDGED',
      ownerReply: 'Bahut shukriya batane ke liye! App se band kar raha hoon.',
      ownerReplyTimestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
    });

    localStore.alerts.push({
      _id: 'alert_ind_4',
      tagId: tag3,
      ownerId: 'user_priyansh_gupta',
      vehicleSummary: '2024 Royal Enfield Classic 350 (Halcyon Black)',
      originalMessage: 'Hi, an auto-rickshaw lightly grazed your bike exhaust guard while taking a sharp turn near 100ft road. No dent, but minor scratch on chrome.',
      originalLanguage: 'English',
      translatedMessage: 'नमस्ते, 100 फीट रोड के पास एक ऑटो-रिक्शा ने आपकी बाइक के क्रोम एग्जॉस्ट गार्ड को हल्का छू दिया। कोई डेंट नहीं है, केवल मामूली स्क्रैच है।',
      ownerLanguage: 'hi',
      urgency: 'LOW',
      intentCategory: 'COLLISION_DAMAGE',
      actionAdvisory: 'Minor cosmetic graze on exhaust chrome reported in Indiranagar.',
      location: {
        latitude: 12.9719,
        longitude: 77.6412,
        accuracy: 6,
        address: 'Opposite Toit, 100 Feet Road, Indiranagar, Bengaluru, Karnataka'
      },
      damageReport: {
        hasImage: false,
        severity: 'Low',
        summary: 'Surface scrape on exhaust pipe guard.'
      },
      quickReplies: [
        'Thanks for letting me know, I will inspect it.',
        'Did the auto stop or note down the number?',
        'Appreciate the heads-up brother!'
      ],
      bystanderName: 'Karthik N.',
      bystanderContact: '',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    });

    saveLocalStore();
  }
}

function loadLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      localStore.vehicles = parsed.vehicles || [];
      localStore.alerts = parsed.alerts || [];
      localStore.users = parsed.users || [];
    }
  } catch (err) {
    console.warn('Could not read local store file, starting clean:', err);
  }
}

function saveLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save to local store file:', err);
  }
}

export async function connectDB() {
  loadLocalStore();
  await initSeedData();

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.log('ℹ️  No MONGO_URI specified. Operating seamlessly with embedded persistent database.');
    return;
  }

  // Prevent unhandled error events from bubbling up
  mongoose.connection.on('error', () => {
    // Suppress background connection error noise when remote Atlas cluster is unreachable
  });

  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
      bufferCommands: false
    });
    isMongoConnected = true;
    console.log('✅ Successfully connected to MongoDB database via Mongoose.');
  } catch (_err) {
    isMongoConnected = false;
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    console.log('ℹ️  MongoDB Atlas cluster unreachable (IP whitelist restriction or network). Active engine: High-performance Embedded Persistent JSON Store.');
  }
}

export const db = {
  isMongo: () => isMongoConnected,
  getStatus: () => ({
    connected: isMongoConnected,
    engine: isMongoConnected ? 'MongoDB Atlas' : 'Embedded Persistent JSON Store',
    configuredUri: !!process.env.MONGO_URI
  }),

  // User Methods
  async getUserById(id: string): Promise<any | null> {
    if (isMongoConnected) {
      return await UserModel.findById(id).lean();
    }
    let found = localStore.users.find(u => (u._id || u.id) === id);
    if (!found) {
      loadLocalStore();
      found = localStore.users.find(u => (u._id || u.id) === id);
    }
    return found || null;
  },

  async getUserByEmail(email: string): Promise<any | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongoConnected) {
      return await UserModel.findOne({ email: cleanEmail }).lean();
    }
    let found = localStore.users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (!found) {
      loadLocalStore();
      found = localStore.users.find(u => u.email?.toLowerCase() === cleanEmail);
    }
    return found || null;
  },

  async getUserByUsername(username: string): Promise<any | null> {
    const cleanUsername = username.toLowerCase().trim();
    if (isMongoConnected) {
      return await UserModel.findOne({ username: cleanUsername }).lean();
    }
    let found = localStore.users.find(u => u.username?.toLowerCase() === cleanUsername);
    if (!found) {
      loadLocalStore();
      found = localStore.users.find(u => u.username?.toLowerCase() === cleanUsername);
    }
    return found || null;
  },

  async createUser(userData: any): Promise<any> {
    if (isMongoConnected) {
      const user = new UserModel(userData);
      return await user.save();
    }
    const userWithId = {
      _id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...userData,
      createdAt: new Date().toISOString()
    };
    localStore.users.push(userWithId);
    saveLocalStore();
    return userWithId;
  },

  async getVehicles(ownerId?: string): Promise<any[]> {
    if (isMongoConnected) {
      const filter: any = {};
      if (ownerId) filter.ownerId = ownerId;
      return await VehicleModel.find(filter).sort({ createdAt: -1 }).lean();
    }
    loadLocalStore();
    let list = [...localStore.vehicles];
    if (ownerId) {
      list = list.filter(v => v.ownerId === ownerId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getVehicleByTag(tagId: string): Promise<any | null> {
    if (isMongoConnected) {
      return await VehicleModel.findOne({ tagId }).lean();
    }
    let found = localStore.vehicles.find(v => v.tagId === tagId);
    if (!found) {
      loadLocalStore();
      found = localStore.vehicles.find(v => v.tagId === tagId);
    }
    return found || null;
  },

  async createVehicle(vehicleData: any): Promise<any> {
    if (isMongoConnected) {
      const created = new VehicleModel(vehicleData);
      return await created.save();
    }
    loadLocalStore();
    localStore.vehicles.unshift(vehicleData);
    saveLocalStore();
    return vehicleData;
  },

  async deleteVehicle(tagId: string): Promise<boolean> {
    if (isMongoConnected) {
      await VehicleModel.deleteOne({ tagId });
      await AlertModel.deleteMany({ tagId });
      return true;
    }
    loadLocalStore();
    localStore.vehicles = localStore.vehicles.filter(v => v.tagId !== tagId);
    localStore.alerts = localStore.alerts.filter(a => a.tagId !== tagId);
    saveLocalStore();
    return true;
  },

  async getAlerts(tagId?: string, urgency?: string, ownerId?: string): Promise<any[]> {
    if (isMongoConnected) {
      const filter: any = {};
      if (tagId) filter.tagId = tagId;
      if (urgency) filter.urgency = urgency;
      if (ownerId) filter.ownerId = ownerId;
      return await AlertModel.find(filter).sort({ createdAt: -1 }).lean();
    }
    loadLocalStore();
    let list = [...localStore.alerts];
    if (tagId) list = list.filter(a => a.tagId === tagId);
    if (urgency) list = list.filter(a => a.urgency === urgency);
    if (ownerId) list = list.filter(a => a.ownerId === ownerId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAlertById(id: string): Promise<any | null> {
    if (isMongoConnected) {
      return await AlertModel.findById(id).lean();
    }
    let found = localStore.alerts.find(a => (a._id || a.id) === id);
    if (!found) {
      loadLocalStore();
      found = localStore.alerts.find(a => (a._id || a.id) === id);
    }
    return found || null;
  },

  async createAlert(alertData: any): Promise<any> {
    if (isMongoConnected) {
      const alert = new AlertModel(alertData);
      return await alert.save();
    }
    loadLocalStore();
    const alertWithId = {
      _id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...alertData
    };
    localStore.alerts.unshift(alertWithId);
    saveLocalStore();
    return alertWithId;
  },

  async updateAlert(id: string, updateData: any): Promise<any | null> {
    if (isMongoConnected) {
      return await AlertModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    }
    const idx = localStore.alerts.findIndex(a => (a._id || a.id) === id);
    if (idx === -1) return null;
    localStore.alerts[idx] = { ...localStore.alerts[idx], ...updateData };
    saveLocalStore();
    return localStore.alerts[idx];
  }
};
