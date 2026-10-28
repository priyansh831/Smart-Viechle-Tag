import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Car,
  AlertTriangle,
  Camera,
  X,
  Send,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  EyeOff,
  Upload,
  RefreshCw,
  MapPin,
  Compass,
  MessageCircle
} from 'lucide-react';
import { IPublicVehicle, IGeoLocation } from '../types/index.js';
import { getSocket } from '../services/socket.js';

interface ScanPageProps {
  tagId: string;
  onBackToDashboard: () => void;
  availableVehicles?: Array<{ tagId: string; make: string; model: string; licensePlate: string }>;
  onSwitchTag?: (newTagId: string) => void;
}

const INDIAN_PRESET_MESSAGES = [
  {
    label: '🚗 Society Gate Blocked (गेट ब्लॉक है)',
    text: 'Bhaiya aapki gaadi Society / Building gate ke saamne khadi hai, doosri gaadiyan nikal nahi paa rahi. Please turant thoda aage badha lijiye.'
  },
  {
    label: '🚨 Traffic Towing / Crane (टोइंग अलर्ट)',
    text: 'Traffic Police towing crane has reached this area! Cars parked here are getting towed or issued challans. Please move your vehicle immediately!'
  },
  {
    label: '🌧️ Monsoon Rain / Window Open (खिड़की खुली है)',
    text: 'Namaste ji, heavy rain start ho gayi hai aur aapki gaadi ka window khula hai. Paani andar seat par jaa raha hai.'
  },
  {
    label: '💡 Hazard / Headlights On (लाइट्स ऑन हैं)',
    text: 'Notice: Your vehicle headlights or hazard blinker lights were left ON in the parking area. Battery might drain completely.'
  },
  {
    label: '💥 Scratch / Minor Collision (स्क्रैच / टक्कर)',
    text: 'Notice: Another vehicle or auto-rickshaw lightly grazed your bumper while reversing. I took a photo of the area for your record.'
  },
  {
    label: '🛞 Flat Tyre / Puncture (टायर पंक्चर है)',
    text: 'Notice: Your rear tire appears completely flat / punctured.'
  }
];

const INDIAN_LANDMARK_PRESETS = [
  { label: 'DLF Cyber City, Gurugram', lat: 28.4950, lng: 77.0895, address: 'Tower B Gate, DLF Cyber City Phase 2, Gurugram, HR' },
  { label: 'Indiranagar 100ft Rd, Bengaluru', lat: 12.9719, lng: 77.6412, address: 'Opposite Toit, 100 Feet Road, Indiranagar, Bengaluru, KA' },
  { label: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167, address: 'Inner Circle Block C Parking, Connaught Place, New Delhi, DL' },
  { label: 'Linking Road, Bandra, Mumbai', lat: 19.0596, lng: 72.8295, address: 'Near KFC, Linking Road, Bandra West, Mumbai, MH' }
];

const BYSTANDER_LANGUAGES = [
  { code: 'auto', label: 'Auto-Detect My Language' },
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

export const ScanPage: React.FC<ScanPageProps> = ({
  tagId,
  onBackToDashboard,
  availableVehicles = [],
  onSwitchTag
}) => {
  const [vehicle, setVehicle] = useState<IPublicVehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  // Form State
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('auto');
  const [bystanderName, setBystanderName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Geolocation State
  const [location, setLocation] = useState<IGeoLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Submission & AI State
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'analyzing' | 'vision' | 'delivered'>('idle');
  const [submittedAlertId, setSubmittedAlertId] = useState<string | null>(null);
  const [ownerReply, setOwnerReply] = useState<string | null>(null);
  const [ownerReplyTime, setOwnerReplyTime] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Gemini AI message refinement
  const [polishing, setPolishing] = useState(false);
  const [polishAlternatives, setPolishAlternatives] = useState<string[]>([]);

  const handlePolishMessage = async (tone: 'polite' | 'urgent' | 'deescalate' = 'polite') => {
    if (!message.trim()) return;
    setPolishing(true);
    try {
      const res = await fetch('/api/ai/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.trim(), tone })
      });
      const data = await res.json();
      if (data.success && data.polishedText) {
        setMessage(data.polishedText);
        if (Array.isArray(data.alternatives) && data.alternatives.length > 0) {
          setPolishAlternatives(data.alternatives);
        }
      }
    } catch (err) {
      console.error('Failed to polish message with Gemini:', err);
    } finally {
      setPolishing(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load public vehicle info
  useEffect(() => {
    let isMounted = true;
    async function fetchVehicle() {
      setLoadingVehicle(true);
      setVehicleError(null);
      setSubmittedAlertId(null);
      setOwnerReply(null);

      try {
        const res = await fetch(`/api/tags/${tagId}/public`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'SmartTag not recognized.');
        }
        if (isMounted) {
          setVehicle(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setVehicleError(err.message || 'Failed to locate vehicle tag.');
        }
      } finally {
        if (isMounted) {
          setLoadingVehicle(false);
        }
      }
    }

    if (tagId) {
      fetchVehicle();
    }
    return () => {
      isMounted = false;
    };
  }, [tagId]);

  // Real-time WebSocket connection to receive driver replies instantly
  useEffect(() => {
    const socket = getSocket();
    if (tagId) {
      socket.emit('join:tag', tagId);
    }

    const handleDriverReply = (payload: { alertId: string; replyMessage: string; timestamp: string }) => {
      setOwnerReply(payload.replyMessage);
      setOwnerReplyTime(payload.timestamp);
    };

    socket.on('alert:reply', handleDriverReply);

    return () => {
      socket.off('alert:reply', handleDriverReply);
    };
  }, [tagId]);

  // Handle Photo Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Photo is too large. Please select an image under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Detect GPS
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          address: `GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationError('Could not obtain GPS. Pick an Indian landmark shortcut or retry.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSelectLandmark = (preset: typeof INDIAN_LANDMARK_PRESETS[0]) => {
    setLocation({
      latitude: preset.lat,
      longitude: preset.lng,
      accuracy: 10,
      address: preset.address
    });
    setLocationError(null);
  };

  const handleClearLocation = () => {
    setLocation(null);
    setLocationError(null);
  };

  // Submit Alert
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitPhase(imagePreview ? 'vision' : 'analyzing');

    try {
      const res = await fetch(`/api/tags/${tagId}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          language: language === 'auto' ? undefined : language,
          bystanderName: bystanderName.trim() || undefined,
          imageBase64: imagePreview || undefined,
          location: location || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to deliver alert to driver.');
      }

      setSubmittedAlertId(data.alertId);
      setSubmitPhase('delivered');
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while sending alert.');
      setSubmitPhase('idle');
    } finally {
      setSubmitting(false);
    }
  };

  // Open WhatsApp fallback
  const handleOpenWhatsAppRelay = () => {
    const text = encodeURIComponent(
      `🚨 [SmartTag India Emergency Alert]\nVehicle: ${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''} (${vehicle?.maskedPlate || ''})\n\nIssue: ${message || 'Vehicle blocking or emergency'}\nLocation: ${location?.address || 'Current parking spot'}\n\n(Zero phone leak relay active)`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white text-black min-h-screen py-8 px-4 select-none">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-black uppercase text-black hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>RETURN TO DASHBOARD</span>
          </button>

          {availableVehicles.length > 1 && onSwitchTag && (
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span>TAG:</span>
              <select
                value={tagId}
                onChange={(e) => onSwitchTag(e.target.value)}
                className="border-2 border-black px-2 py-0.5 text-xs font-mono font-bold bg-white text-black focus:outline-none"
              >
                {availableVehicles.map((v) => (
                  <option key={v.tagId} value={v.tagId}>
                    {v.make} {v.model} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Brand Banner */}
        <div className="bg-black text-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-blue-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs">
              IND 🇮🇳
            </span>
            <Shield className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            <div>
              <p className="font-black italic text-lg text-yellow-400 leading-none">
                SMART TAG INDIA VERIFIED
              </p>
              <p className="text-[11px] font-bold text-neutral-300 mt-0.5">
                Zero-Leak Privacy • Driver Phone Number Stays Encrypted
              </p>
            </div>
          </div>
          <span className="bg-yellow-400 text-black font-black text-[10px] uppercase px-2 py-1">
            PROTECTED
          </span>
        </div>

        {/* Loading / Error States */}
        {loadingVehicle ? (
          <div className="p-12 border-2 border-black text-center space-y-2">
            <RefreshCw className="w-8 h-8 text-black animate-spin mx-auto" />
            <p className="font-bold text-sm">Verifying Indian vehicle SmartTag...</p>
          </div>
        ) : vehicleError ? (
          <div className="p-8 border-2 border-red-500 bg-red-50 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="font-black text-lg text-red-800">SmartTag Not Found</h3>
            <p className="text-xs text-neutral-700">{vehicleError}</p>
            <button
              onClick={onBackToDashboard}
              className="bg-black text-yellow-400 font-black text-xs uppercase px-5 py-2 border-2 border-black"
            >
              Go to Dashboard
            </button>
          </div>
        ) : vehicle ? (
          <div className="space-y-6">
            {/* Confirmed Vehicle Card */}
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000000] space-y-2">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <span className="text-xs font-black uppercase text-neutral-600 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-black" />
                  <span>REGISTERED INDIAN VEHICLE</span>
                </span>
                
                {/* HSRP Plate Badge */}
                <div className="inline-flex items-center border border-black bg-white rounded shadow-2xs overflow-hidden">
                  <div className="bg-blue-800 text-white px-1.5 py-0.5 flex items-center justify-center text-[8px] font-black">
                    IND
                  </div>
                  <div className="px-2 py-0.5 font-mono font-black text-black text-xs bg-yellow-400">
                    {vehicle.maskedPlate}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-xl font-black text-black uppercase">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="text-xs text-neutral-600">
                    Color: <strong>{vehicle.color || 'Standard'}</strong> • Tag:{' '}
                    <span className="font-mono">{vehicle.tagId}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-neutral-500">
                    CONTACT PRIVACY
                  </p>
                  <p className="font-mono text-xs font-black text-black flex items-center justify-end gap-1">
                    <EyeOff className="w-3 h-3" />
                    <span>{vehicle.ownerPhoneMasked}</span>
                  </p>
                </div>
              </div>

              {vehicle.emergencyNotes && (
                <div className="p-2 bg-yellow-100 border border-yellow-400 text-xs font-bold text-black mt-2">
                  ⚠️ Driver Note: {vehicle.emergencyNotes}
                </div>
              )}
            </div>

            {/* Post-Submission Screen */}
            {submitPhase === 'delivered' ? (
              <div className="bg-white border-2 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000000] text-center space-y-6">
                <div className="w-16 h-16 bg-yellow-400 border-2 border-black mx-auto flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
                  <CheckCircle2 className="w-10 h-10 text-black stroke-[2.5]" />
                </div>

                <div>
                  <h3 className="text-2xl font-black uppercase text-black mb-1">
                    ALERT DELIVERED TO DRIVER!
                  </h3>
                  <p className="text-xs text-neutral-700 max-w-md mx-auto">
                    Gemini AI translated your alert into the driver&apos;s preferred language (Hindi/English) and dispatched an instant real-time notification with your GPS location. Keep this screen open for their reply.
                  </p>
                </div>

                {/* Driver Live Reply Box */}
                <div className="p-4 bg-black text-white border-2 border-yellow-400 text-left space-y-3 shadow-[4px_4px_0px_0px_#facc15]">
                  <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
                    <span className="font-black text-yellow-400 flex items-center gap-1.5 uppercase">
                      <Car className="w-4 h-4 text-yellow-400" />
                      <span>DRIVER LIVE STATUS (लाइव रिस्पांस)</span>
                    </span>
                    {ownerReply ? (
                      <span className="bg-yellow-400 text-black text-[10px] font-black uppercase px-2 py-0.5">
                        REPLIED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-yellow-400">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>WAITING FOR DRIVER REPLY...</span>
                      </span>
                    )}
                  </div>

                  {ownerReply ? (
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-400 uppercase font-black">
                        Driver Response:
                      </p>
                      <p className="text-lg font-black text-yellow-400">
                        &ldquo;{ownerReply}&rdquo;
                      </p>
                      {ownerReplyTime && (
                        <p className="text-[10px] font-mono text-neutral-400">
                          Received at {new Date(ownerReplyTime).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-300 italic">
                      The driver received an urgent chime and notification banner on their phone/dashboard.
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setSubmitPhase('idle');
                      setSubmittedAlertId(null);
                      setMessage('');
                      setImagePreview(null);
                      setLocation(null);
                      setOwnerReply(null);
                    }}
                    className="flex-1 bg-white hover:bg-neutral-100 text-black font-black uppercase text-xs py-3 border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
                  >
                    SEND ANOTHER MESSAGE
                  </button>
                  <button
                    onClick={onBackToDashboard}
                    className="flex-1 bg-black hover:bg-neutral-900 text-yellow-400 font-black uppercase text-xs py-3 border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
                  >
                    OWNER DASHBOARD
                  </button>
                </div>
              </div>
            ) : (
              /* Bystander Form */
              <form
                onSubmit={handleSubmit}
                className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_#000000] space-y-5"
              >
                {submitError && (
                  <div className="p-3 bg-red-100 border border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Quick Indian Issue Presets */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    QUICK ISSUE TEMPLATES (TAP TO SELECT):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INDIAN_PRESET_MESSAGES.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setMessage(preset.text)}
                        className="border border-black bg-white hover:bg-yellow-400 hover:text-black px-2.5 py-1 text-xs font-bold text-black transition-colors cursor-pointer text-left"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black uppercase tracking-wider text-black">
                      YOUR MESSAGE TO DRIVER (संदेश) <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold text-neutral-500">
                      {message.length}/500
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    maxLength={500}
                    placeholder="Describe gate block, towing crane alert, open window in rain, or scratch in Hindi, Hinglish, or English..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border-2 border-black p-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white resize-none"
                  />
                  
                  {/* AI Polish Toolbar */}
                  <div className="mt-2 p-2 bg-neutral-100 border border-black flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                      <span className="text-[11px] font-black uppercase text-black">
                        Gemini AI Assistant:
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={polishing || !message.trim()}
                        onClick={() => handlePolishMessage('polite')}
                        className="bg-yellow-400 hover:bg-black hover:text-yellow-400 text-black text-[10px] font-black uppercase px-2 py-1 border border-black transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        {polishing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>Polite Polish</span>
                      </button>
                      <button
                        type="button"
                        disabled={polishing || !message.trim()}
                        onClick={() => handlePolishMessage('urgent')}
                        className="bg-white hover:bg-black hover:text-white text-black text-[10px] font-black uppercase px-2 py-1 border border-black transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        More Urgent
                      </button>
                      <button
                        type="button"
                        disabled={polishing || !message.trim()}
                        onClick={() => handlePolishMessage('deescalate')}
                        className="bg-white hover:bg-black hover:text-white text-black text-[10px] font-black uppercase px-2 py-1 border border-black transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        De-escalate
                      </button>
                    </div>
                  </div>

                  {/* AI Alternatives */}
                  {polishAlternatives.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-400 space-y-1">
                      <p className="text-[10px] font-black uppercase text-neutral-800">
                        AI Alternative Options (Tap to use):
                      </p>
                      <div className="flex flex-col gap-1">
                        {polishAlternatives.map((alt, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => setMessage(alt)}
                            className="text-left text-xs text-black font-medium hover:bg-yellow-200 p-1 rounded border border-neutral-300 transition-colors"
                          >
                            &ldquo;{alt}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-neutral-600 mt-1">
                    🇮🇳 Tip: You can type in Hindi, Hinglish (e.g. <em>&quot;Bhaiya gaadi gate se hata lo&quot;</em>) or English. Gemini AI translates seamlessly.
                  </p>
                </div>

                {/* GPS Location Capture & Indian Landmark Presets */}
                <div className="border border-black p-3.5 bg-neutral-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-black" />
                      <span>ATTACH VEHICLE LOCATION (स्थान)</span>
                    </span>
                    {location && (
                      <span className="bg-yellow-400 text-black font-black text-[10px] px-2 py-0.5 border border-black">
                        LOCATION ATTACHED
                      </span>
                    )}
                  </div>

                  {location ? (
                    <div className="p-2.5 bg-white border border-black text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-black">{location.address || 'Custom GPS Pin'}</span>
                        <button
                          type="button"
                          onClick={handleClearLocation}
                          className="text-red-600 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-neutral-600">
                        {location.latitude.toFixed(5)}° N, {location.longitude.toFixed(5)}° E (±{location.accuracy || 10}m)
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={locating}
                        onClick={handleDetectLocation}
                        className="w-full py-2.5 bg-white hover:bg-black hover:text-yellow-400 text-black font-black uppercase text-xs border border-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        {locating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>DETECTING DEVICE GPS...</span>
                          </>
                        ) : (
                          <>
                            <Compass className="w-3.5 h-3.5" />
                            <span>DETECT CURRENT GPS LOCATION</span>
                          </>
                        )}
                      </button>

                      <div className="pt-1">
                        <p className="text-[10px] font-bold text-neutral-600 uppercase mb-1">
                          Or quick pick Indian landmark (testing / indoor):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {INDIAN_LANDMARK_PRESETS.map((lp, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectLandmark(lp)}
                              className="px-2 py-1 text-[11px] bg-neutral-200 hover:bg-yellow-300 border border-neutral-400 text-black font-medium transition-colors cursor-pointer"
                            >
                              📍 {lp.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {locationError && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">
                          {locationError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Language & Bystander Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      YOUR LANGUAGE
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border-2 border-black p-2 text-xs font-bold bg-white text-black focus:outline-none"
                    >
                      {BYSTANDER_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      YOUR ROLE / NAME (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Society Guard, Neighbor, Fellow Driver"
                      value={bystanderName}
                      onChange={(e) => setBystanderName(e.target.value)}
                      className="w-full border-2 border-black p-2 text-xs font-bold bg-white text-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* Optional Photo Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-black flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-black" />
                      <span>ATTACH DAMAGE / OBSTRUCTION PHOTO (OPTIONAL)</span>
                    </span>
                    <span className="text-[10px] bg-black text-yellow-400 font-black px-1.5 py-0.5">
                      GEMINI VISION
                    </span>
                  </label>

                  {imagePreview ? (
                    <div className="relative border-2 border-black p-2 bg-neutral-100">
                      <img
                        src={imagePreview}
                        alt="Scene"
                        className="w-full max-h-48 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-4 right-4 bg-black text-white p-1 hover:bg-red-600 cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-black p-4 text-center cursor-pointer hover:bg-yellow-50 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-black mx-auto mb-1" />
                      <p className="text-xs font-black uppercase text-black">
                        TAP TO CAPTURE OR UPLOAD VEHICLE PHOTO
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase tracking-wider text-sm py-4 border-2 border-black transition-all cursor-pointer shadow-[4px_4px_0px_0px_#000000]"
                  >
                    {submitting ? (
                      <span>
                        {submitPhase === 'vision'
                          ? 'ANALYZING PHOTO WITH GEMINI VISION...'
                          : 'TRANSLATING & DELIVERING TO DRIVER...'}
                      </span>
                    ) : (
                      <span>SEND SMARTTAG ALERT PRIVATELY (तुरंत भेजें)</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWhatsAppRelay}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-wider text-xs py-2.5 border-2 border-black transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>OR SHARE VIA WHATSAPP RELAY (बिना नंबर दिखे)</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
