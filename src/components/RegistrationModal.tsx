import React, { useState } from 'react';
import { X, ShieldCheck, Car, QrCode, Download, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { IVehicle } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleCreated: (vehicle: IVehicle) => void;
  onOpenPlacard: (vehicle: IVehicle) => void;
}

const POPULAR_INDIAN_MAKES = [
  'Tata Motors',
  'Mahindra',
  'Maruti Suzuki',
  'Hyundai',
  'Kia',
  'Toyota',
  'Honda',
  'Royal Enfield',
  'Ather Energy',
  'Ola Electric',
  'TVS Motor',
  'Bajaj Auto',
  'MG Motor',
  'Skoda',
  'Volkswagen',
  'BMW',
  'Mercedes-Benz'
];

const INDIAN_STATES = [
  { code: 'DL', state: 'Delhi' },
  { code: 'MH', state: 'Maharashtra' },
  { code: 'KA', state: 'Karnataka' },
  { code: 'HR', state: 'Haryana' },
  { code: 'UP', state: 'Uttar Pradesh' },
  { code: 'TN', state: 'Tamil Nadu' },
  { code: 'TS', state: 'Telangana' },
  { code: 'GJ', state: 'Gujarat' },
  { code: 'WB', state: 'West Bengal' },
  { code: 'RJ', state: 'Rajasthan' },
  { code: 'KL', state: 'Kerala' },
  { code: 'PB', state: 'Punjab' },
  { code: 'CH', state: 'Chandigarh' },
  { code: 'BH', state: 'Bharat Series' }
];

const INDIAN_LANGUAGES = [
  { code: 'hi', label: 'हिन्दी (Hindi / Hinglish)' },
  { code: 'en', label: 'English (Indian English)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' }
];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onVehicleCreated,
  onOpenPlacard
}) => {
  const { user, authFetch } = useAuth();
  const [vehicleType, setVehicleType] = useState<'4w' | '2w' | 'commercial'>('4w');
  const [formData, setFormData] = useState({
    licensePlate: '',
    make: 'Tata Motors',
    model: 'Nexon EV',
    year: new Date().getFullYear().toString(),
    color: 'Daytona Grey',
    ownerName: user?.fullName || user?.username || 'Priyansh Gupta',
    ownerPhone: '+91 98765 43210',
    preferredLanguage: user?.preferredLanguage || 'hi',
    emergencyNotes: 'High Voltage EV. Frunk charging port.'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVehicle, setCreatedVehicle] = useState<IVehicle | null>(null);

  if (!isOpen) return null;

  const handleApplyStatePrefix = (stateCode: string) => {
    const current = formData.licensePlate.trim();
    if (!current || /^[A-Z]{2}/.test(current)) {
      setFormData({
        ...formData,
        licensePlate: `${stateCode} `
      });
    } else {
      setFormData({
        ...formData,
        licensePlate: `${stateCode} ${current}`
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authFetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          licensePlate: formData.licensePlate.toUpperCase().trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register Indian vehicle.');
      }

      setCreatedVehicle(data.vehicle);
      onVehicleCreated(data.vehicle);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating vehicle tag.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!createdVehicle?.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = createdVehicle.qrCodeUrl;
    a.download = `SmartTag_${createdVehicle.licensePlate.replace(/\s+/g, '_')}_QR.png`;
    a.click();
  };

  const resetAndClose = () => {
    setCreatedVehicle(null);
    setFormData({
      licensePlate: '',
      make: 'Tata Motors',
      model: 'Nexon EV',
      year: new Date().getFullYear().toString(),
      color: 'Daytona Grey',
      ownerName: user?.fullName || user?.username || 'Priyansh Gupta',
      ownerPhone: '+91 98765 43210',
      preferredLanguage: 'hi',
      emergencyNotes: ''
    });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-black text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 text-black flex items-center justify-center font-black">
              <Car className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-blue-700 text-white font-black px-1.5 py-0.2 rounded-xs">
                  IND 🇮🇳
                </span>
                <h3 className="font-black italic uppercase tracking-wider text-yellow-400 text-base">
                  {createdVehicle ? 'INDIAN VEHICLE SMART TAG ACTIVE' : 'REGISTER INDIAN VEHICLE & CREATE TAG'}
                </h3>
              </div>
              <p className="text-xs text-neutral-300 font-bold">
                {createdVehicle ? 'HSRP & Fastag compliant privacy tag ready' : 'RTO High Security Plate & Fastag privacy format'}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {createdVehicle ? (
          <div className="p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-yellow-400 text-black mx-auto flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <CheckCircle2 className="w-9 h-9 text-black stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-xl font-black uppercase text-black mb-1">
                {createdVehicle.year} {createdVehicle.make} {createdVehicle.model}
              </h4>
              
              {/* Indian HSRP License Plate Render */}
              <div className="inline-flex items-center border-2 border-black bg-white rounded shadow-sm overflow-hidden my-2">
                <div className="bg-blue-800 text-white px-2 py-1 flex flex-col items-center justify-center border-r border-black">
                  <span className="text-[8px] font-black leading-none">INDIA</span>
                  <span className="text-[9px] font-black mt-0.5">IND</span>
                </div>
                <div className="px-3 py-1 font-mono font-black text-black text-base tracking-widest bg-yellow-400">
                  {createdVehicle.licensePlate}
                </div>
              </div>

              <p className="text-xs text-neutral-700 font-bold mt-1">
                SMART TAG ID:{' '}
                <span className="font-mono text-black font-black bg-neutral-200 px-1.5 py-0.5">{createdVehicle.tagId}</span>
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white inline-block border-4 border-black shadow-[6px_6px_0px_0px_#000] mx-auto">
              <img
                src={createdVehicle.qrCodeUrl}
                alt="SmartTag QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>

            <div className="bg-neutral-100 border-2 border-black p-4 text-left text-xs text-black space-y-1.5">
              <div className="flex items-center gap-2 font-black uppercase tracking-wider text-black">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>RTO Contact Privacy Guaranteed</span>
              </div>
              <p className="font-medium text-neutral-800">
                When scanned by a bystander or traffic warden in Delhi, Mumbai, Bengaluru or anywhere in India, your mobile number (
                <span className="font-mono font-bold text-black">{createdVehicle.ownerPhoneMasked}</span>) stays 100% hidden. Incoming bystander messages in Hindi, Hinglish or English will automatically translate to your preferred language.
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  onOpenPlacard(createdVehicle);
                  resetAndClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>PRINT WINDSHIELD TAG</span>
              </button>

              <button
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-neutral-900 text-yellow-400 font-black uppercase tracking-wider text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD QR IMAGE</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Vehicle Type selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                VEHICLE CATEGORY (भारत)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVehicleType('4w')}
                  className={`py-2 px-2 text-xs font-black uppercase border-2 border-black text-center transition-all cursor-pointer ${
                    vehicleType === '4w'
                      ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  🚗 4-Wheeler (Car/EV)
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('2w')}
                  className={`py-2 px-2 text-xs font-black uppercase border-2 border-black text-center transition-all cursor-pointer ${
                    vehicleType === '2w'
                      ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  🛵 2-Wheeler (Bike)
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('commercial')}
                  className={`py-2 px-2 text-xs font-black uppercase border-2 border-black text-center transition-all cursor-pointer ${
                    vehicleType === 'commercial'
                      ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  🛺 Commercial / Cab
                </button>
              </div>
            </div>

            {/* State code helper */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black uppercase tracking-wider text-black">
                  INDIAN REGISTRATION / RTO STATE
                </label>
                <span className="text-[10px] font-bold text-neutral-600">Click to prefix</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INDIAN_STATES.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => handleApplyStatePrefix(s.code)}
                    className="px-2 py-0.5 text-[11px] font-mono font-bold bg-neutral-100 hover:bg-yellow-400 border border-black text-black transition-colors cursor-pointer"
                    title={s.state}
                  >
                    {s.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  PLATE NUMBER (RTO FORMAT) <span className="text-red-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-2 flex items-center gap-1 text-[10px] font-black text-blue-800 bg-blue-100 px-1 py-0.5 border border-blue-400 pointer-events-none">
                    IND
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="DL 08 CA 4321 / MH 02 ER 9000"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                    className="w-full uppercase font-mono font-black pl-14 pr-3 py-2 bg-white border-2 border-black text-black text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  MAKE (BRAND) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="indian-car-makes"
                  placeholder="e.g. Tata Motors, Mahindra"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-black text-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <datalist id="indian-car-makes">
                  {POPULAR_INDIAN_MAKES.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  MODEL <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexon EV, Thar, Swift, Classic 350"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-black text-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">YEAR</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-black text-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">COLOR</label>
                  <input
                    type="text"
                    placeholder="e.g. Daytona Grey"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-black text-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="pt-2 border-t-2 border-black grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  OWNER NAME <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyansh Gupta"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-black text-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  MOBILE NUMBER (SMS ALERTS) <span className="text-red-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-2 flex items-center gap-1 text-xs font-bold text-neutral-700 pointer-events-none">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={formData.ownerPhone.replace(/^\+91\s*/, '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9\s]/g, '');
                      setFormData({ ...formData, ownerPhone: `+91 ${val}` });
                    }}
                    className="w-full pl-16 pr-3 py-2 bg-white border-2 border-black text-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <p className="text-[10px] text-neutral-600 font-bold mt-1">
                  🔒 Kept strictly private. Hashed with SHA-256. Never shown to callers.
                </p>
              </div>
            </div>

            {/* Language & Emergency Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  YOUR PREFERRED LANGUAGE
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-black text-black text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {INDIAN_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-neutral-600 font-medium mt-1">
                  Gemini translates all bystander messages (Hinglish/English/Regional) to this language.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  EMERGENCY NOTES (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. EV High Voltage, Child seat in back, Fastag active"
                  value={formData.emergencyNotes}
                  onChange={(e) => setFormData({ ...formData, emergencyNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-black text-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase tracking-wider text-sm border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>CREATE SMART TAG (BHARAT EDITION)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
