import React, { useState } from 'react';
import {
  Car,
  Clock,
  Printer,
  QrCode,
  Shield,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Camera,
  MapPin,
  Compass,
  CornerDownRight,
  Send,
  EyeOff,
  Radio,
  CheckCircle2,
  X,
  AlertTriangle,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { IVehicle, IAlert, IDamageReport, IUser } from '../types/index.js';

interface DashboardPageProps {
  vehicles: IVehicle[];
  alerts: IAlert[];
  loading: boolean;
  onOpenRegister: () => void;
  onOpenPlacard: (vehicle: IVehicle) => void;
  onOpenDamageModal: (report: IDamageReport, vehicleSummary?: string) => void;
  onSelectVehicleToScan: (tagId: string) => void;
  onDeleteVehicle: (tagId: string) => void;
  onReplyAlert: (alertId: string, replyMessage: string) => Promise<void>;
  onRefreshAlerts: () => void;
  user: IUser | null;
  onOpenAuth: () => void;
  latestPushedAlert: IAlert | null;
  onDismissPushedAlert: () => void;
  unreadAlertIds: Set<string>;
  onVehicleCreatedDirect: (vehicle: IVehicle) => void;
}

const INDIAN_QUICK_MAKES = [
  'Tata Motors',
  'Mahindra',
  'Maruti Suzuki',
  'Hyundai',
  'Royal Enfield',
  'Ather Energy',
  'Kia',
  'Toyota'
];

const INDIAN_STATE_PREFIXES = ['DL', 'MH', 'KA', 'HR', 'UP', 'TN', 'TS', 'GJ', 'WB', 'BH'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  vehicles,
  alerts,
  loading,
  onOpenRegister,
  onOpenPlacard,
  onOpenDamageModal,
  onSelectVehicleToScan,
  onDeleteVehicle,
  onReplyAlert,
  onRefreshAlerts,
  user,
  onOpenAuth,
  latestPushedAlert,
  onDismissPushedAlert,
  unreadAlertIds,
  onVehicleCreatedDirect
}) => {
  // Inline register form state (matching Indian vehicle context)
  const [inlinePlate, setInlinePlate] = useState('');
  const [inlineEmail, setInlineEmail] = useState(user?.email || 'priyanshg753@gmail.com');
  const [inlinePhone, setInlinePhone] = useState('+91 98765 43210');
  const [inlineMake, setInlineMake] = useState('Tata Motors');
  const [inlineModel, setInlineModel] = useState('Nexon EV');
  const [inlineLang, setInlineLang] = useState(user?.preferredLanguage || 'hi');
  const [submittingTag, setSubmittingTag] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Active vehicle selected for the "YOUR SMART TAG" card
  const [selectedTagIndex, setSelectedTagIndex] = useState<number>(0);
  const activeVehicle = vehicles[selectedTagIndex] || vehicles[0] || null;

  // Bottom section tab: 'vehicles' | 'activity'
  const [bottomTab, setBottomTab] = useState<'vehicles' | 'activity'>('vehicles');
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customReplies, setCustomReplies] = useState<{ [alertId: string]: string }>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [expandedMapAlertId, setExpandedMapAlertId] = useState<string | null>(null);

  // Gemini AI Smart Reply Generator
  const [generatingAiReplies, setGeneratingAiReplies] = useState<{ [alertId: string]: boolean }>({});
  const [aiCustomReplies, setAiCustomReplies] = useState<{ [alertId: string]: string[] }>({});

  const handleGenerateAiReplies = async (alertId: string, alertMessage: string, customInstruction?: string) => {
    setGeneratingAiReplies((prev) => ({ ...prev, [alertId]: true }));
    try {
      const res = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertMessage,
          userInstruction: customInstruction || '',
          language: user?.preferredLanguage || 'hi'
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.replies)) {
        setAiCustomReplies((prev) => ({ ...prev, [alertId]: data.replies }));
      }
    } catch (err) {
      console.error('Failed to generate AI replies:', err);
    } finally {
      setGeneratingAiReplies((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  // Quick State prefix click
  const handlePrefixPlate = (prefix: string) => {
    const trimmed = inlinePlate.trim();
    if (!trimmed || /^[A-Z]{2}/.test(trimmed)) {
      setInlinePlate(`${prefix} `);
    } else {
      setInlinePlate(`${prefix} ${trimmed}`);
    }
  };

  // Handle direct inline registration
  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePlate.trim() || !inlineEmail.trim() || !inlinePhone.trim()) {
      setRegisterError('Please fill in RTO plate number, email, and mobile number.');
      return;
    }

    setSubmittingTag(true);
    setRegisterError(null);
    setRegisterSuccess(null);

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licensePlate: inlinePlate.trim().toUpperCase(),
          make: inlineMake.trim() || 'Vehicle',
          model: inlineModel.trim() || 'Custom',
          year: new Date().getFullYear(),
          ownerName: user?.fullName || user?.username || 'Priyansh Gupta',
          ownerPhone: inlinePhone.trim(),
          preferredLanguage: inlineLang || 'hi',
          emergencyNotes: `Email alerts: ${inlineEmail.trim()}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Indian SmartTag.');
      }

      onVehicleCreatedDirect(data.vehicle);
      setRegisterSuccess(`SmartTag for Indian plate ${inlinePlate.toUpperCase()} created successfully!`);
      setInlinePlate('');
    } catch (err: any) {
      setRegisterError(err.message || 'Error creating SmartTag.');
    } finally {
      setSubmittingTag(false);
    }
  };

  const handleSendReply = async (alertId: string, replyText: string) => {
    if (!replyText.trim()) return;
    setReplyingId(alertId);
    try {
      await onReplyAlert(alertId, replyText.trim());
      setCustomReplies((prev) => ({ ...prev, [alertId]: '' }));
    } finally {
      setReplyingId(null);
    }
  };

  // Filtered alerts
  const filteredAlerts = alerts.filter((a) => {
    if (filterUrgency !== 'ALL' && a.urgency !== filterUrgency) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg =
        a.originalMessage?.toLowerCase().includes(q) ||
        a.translatedMessage?.toLowerCase().includes(q) ||
        a.vehicleSummary?.toLowerCase().includes(q) ||
        a.location?.address?.toLowerCase().includes(q);
      if (!matchMsg) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 select-none">
      {/* REAL-TIME WEBSOCKET PUSH BANNER (If a new alert arrived) */}
      {latestPushedAlert && (
        <div className="bg-red-600 text-white p-4 border-4 border-black shadow-[6px_6px_0px_0px_#000000] flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 text-black flex items-center justify-center font-black shrink-0">
              <Radio className="w-6 h-6 animate-spin text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-400 text-black font-black text-[10px] uppercase px-1.5 py-0.5">
                  LIVE SOCKET.IO PUSH
                </span>
                <span className="font-mono text-xs font-bold">
                  {latestPushedAlert.vehicleSummary}
                </span>
              </div>
              <p className="font-black text-sm uppercase text-white mt-0.5">
                New Emergency Alert: &ldquo;{latestPushedAlert.translatedMessage}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onDismissPushedAlert}
            className="text-neutral-200 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* TOP SECTION: 2-COLUMN BRUTALIST GRID MATCHING SCREENSHOT 448 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* LEFT CARD: REGISTER VEHICLE */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-black stroke-[2.5]" />
            <h2 className="font-black text-xl tracking-tight uppercase text-black">
              REGISTER VEHICLE (INDIA)
            </h2>
          </div>

          <form
            onSubmit={handleInlineRegister}
            className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_#000000] space-y-4"
          >
            {registerError && (
              <div className="p-3 bg-red-100 border border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="p-3 bg-yellow-50 border border-yellow-500 text-black text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                <span>{registerSuccess}</span>
              </div>
            )}

            {/* Quick State Chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-black">
                  STATE PREFIX (RTO)
                </label>
                <span className="text-[10px] text-neutral-500 font-bold">Select state code</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {INDIAN_STATE_PREFIXES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handlePrefixPlate(st)}
                    className="px-2 py-0.5 text-[10px] font-mono font-bold bg-neutral-100 hover:bg-yellow-400 border border-black text-black cursor-pointer"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* PLATE NUMBER */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                PLATE NUMBER (RTO FORMAT)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-2.5 flex items-center gap-1 text-[10px] font-black text-blue-800 bg-blue-100 px-1 py-0.5 border border-blue-400 pointer-events-none">
                  IND 🇮🇳
                </div>
                <input
                  type="text"
                  required
                  placeholder="DL 08 CA 4321 / MH 02 ER 9000"
                  value={inlinePlate}
                  onChange={(e) => setInlinePlate(e.target.value.toUpperCase())}
                  className="w-full border-2 border-black pl-16 pr-2.5 py-2.5 font-mono font-black text-sm text-black uppercase focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                />
              </div>
            </div>

            {/* NOTIFICATION EMAIL */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                NOTIFICATION EMAIL
              </label>
              <input
                type="email"
                required
                placeholder="priyanshg753@gmail.com"
                value={inlineEmail}
                onChange={(e) => setInlineEmail(e.target.value)}
                className="w-full border-2 border-black p-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white font-medium"
              />
              <p className="text-[11px] text-neutral-500 font-medium mt-1">
                Alerts & bystander damage reports will be forwarded to your email.
              </p>
            </div>

            {/* PHONE NUMBER (FOR SMS ALERTS) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                MOBILE NUMBER (PRIVATE SMS ALERTS)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-2.5 text-xs font-bold text-neutral-700 pointer-events-none">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  required
                  placeholder="98765 43210"
                  value={inlinePhone.replace(/^\+91\s*/, '')}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9\s]/g, '');
                    setInlinePhone(`+91 ${clean}`);
                  }}
                  className="w-full border-2 border-black pl-16 pr-2.5 py-2.5 font-mono text-sm text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white font-bold"
                />
              </div>
            </div>

            {/* Indian Make & Model */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1">
                  MAKE (BRAND)
                </label>
                <input
                  type="text"
                  list="quick-indian-makes"
                  placeholder="Tata Motors, Mahindra"
                  value={inlineMake}
                  onChange={(e) => setInlineMake(e.target.value)}
                  className="w-full border border-black p-2 text-xs text-black font-semibold bg-white"
                />
                <datalist id="quick-indian-makes">
                  {INDIAN_QUICK_MAKES.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1">
                  MODEL
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nexon EV, Thar, Swift"
                  value={inlineModel}
                  onChange={(e) => setInlineModel(e.target.value)}
                  className="w-full border border-black p-2 text-xs text-black font-semibold bg-white"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submittingTag}
              className="w-full bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase tracking-wider text-sm py-3.5 border-2 border-black transition-all cursor-pointer shadow-[3px_3px_0px_0px_#000] mt-2"
            >
              {submittingTag ? 'CREATING...' : 'CREATE SMART TAG (BHARAT)'}
            </button>
          </form>
        </div>

        {/* RIGHT CARD: YOUR SMART TAG (BLACK BOX WITH YELLOW FRAME MATCHING SCREENSHOT 448) */}
        <div className="space-y-3">
          <div className="h-7 hidden lg:block" /> {/* Alignment spacer */}
          <div className="bg-black text-white border-2 border-yellow-400 p-6 sm:p-7 shadow-[6px_6px_0px_0px_#facc15] flex flex-col items-center justify-between min-h-[420px]">
            {/* Top Bar inside card */}
            <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-blue-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-xs">
                  IND 🇮🇳
                </span>
                <span className="font-black italic text-lg sm:text-xl tracking-wider text-yellow-400 uppercase">
                  YOUR SMART TAG
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400 text-black text-[11px] font-black uppercase tracking-wider">
                  <RotateCcw className="w-3 h-3 stroke-[3]" />
                  <span>0 REWARDS</span>
                </div>
                <div className="w-6 h-6 bg-yellow-400 text-black flex items-center justify-center">
                  <Shield className="w-4 h-4 fill-black text-black" />
                </div>
              </div>
            </div>

            {/* Center QR Code */}
            {activeVehicle ? (
              <div className="text-center my-4">
                <div className="p-3 bg-white inline-block border-2 border-white shadow-md">
                  <img
                    src={activeVehicle.qrCodeUrl}
                    alt={`SmartTag QR for ${activeVehicle.licensePlate}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                </div>

                {/* Indian HSRP License Plate Render */}
                <div className="mt-3 flex justify-center">
                  <div className="inline-flex items-center border border-black bg-white rounded overflow-hidden">
                    <div className="bg-blue-800 text-white px-2 py-0.5 flex flex-col items-center justify-center text-[7px] font-black">
                      <span>IND</span>
                    </div>
                    <div className="px-2.5 py-0.5 font-mono font-black text-black text-xs bg-yellow-400">
                      {activeVehicle.licensePlate}
                    </div>
                  </div>
                </div>

                <p className="font-bold text-xs text-neutral-300 mt-1">
                  {activeVehicle.year} {activeVehicle.make} {activeVehicle.model} ({activeVehicle.color || 'Standard'})
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-400 text-sm">
                No active tag yet. Register a vehicle on the left to generate your QR code!
              </div>
            )}

            {/* Bottom Caption & Print Button */}
            <div className="w-full text-center space-y-3 pt-2">
              <p className="text-xs font-bold text-yellow-400 tracking-wide">
                Print this FASTag-style QR and stick on your windshield.
              </p>

              {activeVehicle && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => onOpenPlacard(activeVehicle)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-xs sm:text-sm py-2.5 px-8 transition-colors border border-yellow-500 cursor-pointer shadow-md"
                  >
                    PRINT TAG
                  </button>

                  <button
                    onClick={() => onSelectVehicleToScan(activeVehicle.tagId)}
                    className="bg-black hover:bg-neutral-900 text-yellow-400 font-black uppercase tracking-wider text-xs py-2.5 px-4 transition-colors border border-yellow-400 cursor-pointer"
                    title="Simulate scanning as bystander"
                  >
                    SCAN TEST
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: TABS MATCHING SCREENSHOT 448 */}
      <div className="pt-6 border-t-4 border-black space-y-6">
        {/* TAB BUTTONS: YOUR VEHICLES / ACTIVITY LOG */}
        <div className="flex items-center gap-6 border-b-2 border-black pb-2">
          <button
            onClick={() => setBottomTab('vehicles')}
            className={`flex items-center gap-2 text-lg sm:text-xl font-black uppercase tracking-tight transition-all cursor-pointer ${
              bottomTab === 'vehicles'
                ? 'text-black underline decoration-4 decoration-yellow-400 underline-offset-8'
                : 'text-neutral-400 hover:text-black'
            }`}
          >
            <QrCode className="w-5 h-5 text-black" />
            <span>YOUR VEHICLES ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setBottomTab('activity')}
            className={`flex items-center gap-2 text-lg sm:text-xl font-black uppercase tracking-tight transition-all cursor-pointer ${
              bottomTab === 'activity'
                ? 'text-black underline decoration-4 decoration-yellow-400 underline-offset-8'
                : 'text-neutral-400 hover:text-black'
            }`}
          >
            <Clock className="w-5 h-5 text-black" />
            <span>ACTIVITY LOG ({alerts.length})</span>
          </button>
        </div>

        {/* TAB 1: YOUR VEHICLES LIST */}
        {bottomTab === 'vehicles' && (
          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-black text-center space-y-2">
                <Car className="w-8 h-8 text-black mx-auto" />
                <p className="font-bold text-sm text-black">No vehicles registered yet.</p>
                <p className="text-xs text-neutral-600">
                  Use the registration card above to create your first encrypted SmartTag.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((v, idx) => (
                  <div
                    key={v.tagId}
                    className={`border-2 border-black p-5 transition-all shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between ${
                      idx === selectedTagIndex ? 'bg-yellow-50 ring-2 ring-yellow-400' : 'bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {/* HSRP Badge on Card */}
                          <div className="inline-flex items-center border border-black bg-white rounded overflow-hidden">
                            <div className="bg-blue-800 text-white px-1.5 py-0.5 text-[8px] font-black">
                              IND
                            </div>
                            <div className="px-2 py-0.5 font-mono font-black text-black text-xs bg-yellow-400">
                              {v.licensePlate}
                            </div>
                          </div>

                          <h3 className="font-black text-base text-black mt-2">
                            {v.year} {v.make} {v.model}
                          </h3>
                          <p className="text-xs font-mono text-neutral-600 truncate mt-0.5">
                            TAG: {v.tagId}
                          </p>
                        </div>

                        {/* Clickable mini QR */}
                        <div
                          onClick={() => {
                            setSelectedTagIndex(idx);
                            onOpenPlacard(v);
                          }}
                          className="p-1 bg-white border border-black cursor-pointer hover:border-yellow-400 shrink-0"
                          title="Click to print placard"
                        >
                          <img src={v.qrCodeUrl} alt="QR" className="w-14 h-14 object-contain" />
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-neutral-200 text-xs text-neutral-700 space-y-1">
                        <p>
                          <strong>Owner:</strong> {v.ownerName}
                        </p>
                        <p className="flex items-center gap-1 font-mono">
                          <EyeOff className="w-3 h-3 text-black" /> Masked: {v.ownerPhoneMasked}
                        </p>
                        <p>
                          <strong>Preferred Language:</strong>{' '}
                          <span className="uppercase font-bold text-black">{v.preferredLanguage}</span>
                        </p>
                        {v.emergencyNotes && (
                          <p className="text-[11px] font-medium text-neutral-600 truncate">
                            Note: {v.emergencyNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-black">
                      <button
                        onClick={() => {
                          setSelectedTagIndex(idx);
                          onOpenPlacard(v);
                        }}
                        className="bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase text-[11px] py-1.5 border border-black text-center transition-colors cursor-pointer"
                      >
                        PRINT
                      </button>

                      <button
                        onClick={() => onSelectVehicleToScan(v.tagId)}
                        className="bg-white text-black hover:bg-black hover:text-white font-black uppercase text-[11px] py-1.5 border border-black text-center transition-colors cursor-pointer"
                      >
                        SCAN
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete SmartTag for ${v.make} ${v.model}?`)) {
                            onDeleteVehicle(v.tagId);
                          }
                        }}
                        className="bg-white text-red-600 hover:bg-red-600 hover:text-white font-black uppercase text-[11px] py-1.5 border border-black text-center transition-colors cursor-pointer"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVITY LOG FEED */}
        {bottomTab === 'activity' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-100 p-3 border-2 border-black">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  SEVERITY FILTER:
                </span>
                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  className="bg-white border border-black px-2.5 py-1 text-xs font-black uppercase text-black focus:outline-none"
                >
                  <option value="ALL">ALL ALERTS</option>
                  <option value="CRITICAL">🔴 CRITICAL ONLY</option>
                  <option value="MEDIUM">🟡 MEDIUM ONLY</option>
                  <option value="LOW">⚪ LOW ONLY</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Search alerts, locations (e.g. Cyber City, Bandra)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-black px-3 py-1 text-xs font-medium text-black focus:outline-none placeholder-neutral-500 w-full sm:w-72"
              />
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-black text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-black mx-auto" />
                <p className="font-bold text-sm text-black">No alerts matching filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => {
                  const alertId = alert._id || alert.id || '';
                  const isUnread = unreadAlertIds.has(alertId);
                  const isCritical = alert.urgency === 'CRITICAL';
                  const isMedium = alert.urgency === 'MEDIUM';
                  const isMapExpanded = expandedMapAlertId === alertId;

                  return (
                    <div
                      key={alertId}
                      className={`border-2 border-black p-5 transition-all shadow-[4px_4px_0px_0px_#000] space-y-3 ${
                        isUnread
                          ? 'bg-yellow-50 ring-2 ring-yellow-400'
                          : isCritical
                          ? 'bg-red-50/50'
                          : 'bg-white'
                      }`}
                    >
                      {/* Alert Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-black uppercase tracking-wider ${
                              isCritical
                                ? 'bg-red-600 text-white'
                                : isMedium
                                ? 'bg-yellow-400 text-black'
                                : 'bg-black text-white'
                            }`}
                          >
                            {alert.urgency} URGENCY
                          </span>
                          <span className="font-black text-xs uppercase text-neutral-800">
                            {alert.intentCategory}
                          </span>
                          <span className="font-mono text-xs font-bold text-black">
                            • {alert.vehicleSummary}
                          </span>
                        </div>

                        <span className="text-xs font-mono text-neutral-600">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Messages side-by-side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original */}
                        <div className="p-3 bg-neutral-100 border border-black space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                            ORIGINAL BYSTANDER REPORT ({alert.originalLanguage || 'Detected'})
                          </p>
                          <p className="text-sm font-medium text-black">
                            &ldquo;{alert.originalMessage}&rdquo;
                          </p>
                          {alert.bystanderName && (
                            <p className="text-[11px] text-neutral-500 pt-1">
                              By: {alert.bystanderName}
                            </p>
                          )}
                        </div>

                        {/* AI Translated */}
                        <div className="p-3 bg-yellow-100 border border-black space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-black" />
                            <span>GEMINI AI TRANSLATION ({alert.ownerLanguage.toUpperCase()})</span>
                          </p>
                          <p className="text-sm font-bold text-black">
                            &ldquo;{alert.translatedMessage}&rdquo;
                          </p>
                          {alert.actionAdvisory && (
                            <p className="text-[11px] text-neutral-800 pt-1 border-t border-yellow-300">
                              <strong>Advisory:</strong> {alert.actionAdvisory}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* GPS LOCATION SECTION WITH INDIAN ADDRESS */}
                      {alert.location && (
                        <div className="p-3 bg-neutral-50 border border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-2">
                            <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <p className="text-xs font-black text-black">
                                {alert.location.address || 'Indian Parking Landmark'}
                              </p>
                              <p className="font-mono text-[11px] text-neutral-600">
                                Coordinates: {alert.location.latitude.toFixed(5)}° N, {alert.location.longitude.toFixed(5)}° E (±{alert.location.accuracy || 10}m)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedMapAlertId(isMapExpanded ? null : alertId)
                              }
                              className="bg-black text-yellow-400 font-black uppercase text-xs px-2.5 py-1 border border-black cursor-pointer"
                            >
                              {isMapExpanded ? 'HIDE MAP' : 'VIEW MAP'}
                            </button>
                            <a
                              href={`https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-yellow-400 text-black font-black uppercase text-xs px-2.5 py-1 border border-black flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>GOOGLE MAPS</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Expandable Map */}
                      {isMapExpanded && alert.location && (
                        <div className="border border-black bg-white p-1">
                          <iframe
                            title={`Map for alert ${alertId}`}
                            width="100%"
                            height="200"
                            className="border-0"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${alert.location.longitude - 0.004}%2C${alert.location.latitude - 0.003}%2C${alert.location.longitude + 0.004}%2C${alert.location.latitude + 0.003}&layer=mapnik&marker=${alert.location.latitude}%2C${alert.location.longitude}`}
                          />
                        </div>
                      )}

                      {/* Photo Damage Badge */}
                      {alert.damageReport && alert.damageReport.hasImage && (
                        <div className="p-3 bg-white border border-black flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {alert.damageReport.imageUrl && (
                              <img
                                src={alert.damageReport.imageUrl}
                                alt="Damage"
                                className="w-12 h-12 object-cover border border-black shrink-0"
                              />
                            )}
                            <div>
                              <p className="text-xs font-black uppercase text-black flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                <span>DAMAGE EVIDENCE ATTACHED • {alert.damageReport.severity} SEVERITY</span>
                              </p>
                              <p className="text-xs text-neutral-700">
                                {alert.damageReport.summary}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => onOpenDamageModal(alert.damageReport!, alert.vehicleSummary)}
                            className="bg-black text-yellow-400 font-black uppercase text-xs px-3 py-1.5 border border-black shrink-0 cursor-pointer"
                          >
                            INSPECT
                          </button>
                        </div>
                      )}

                      {/* Owner Reply status if sent */}
                      {alert.ownerReply && (
                        <div className="p-2.5 bg-neutral-100 border border-black text-xs text-black font-semibold">
                          You Replied: &ldquo;{alert.ownerReply}&rdquo; (Delivered via WebSockets)
                        </div>
                      )}

                      {/* Quick Replies */}
                      <div className="pt-2 border-t border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3" />
                            <span>1-TAP QUICK REPLIES (तुरंत जवाब दें):</span>
                          </p>

                          <button
                            type="button"
                            disabled={generatingAiReplies[alertId]}
                            onClick={() =>
                              handleGenerateAiReplies(
                                alertId,
                                alert.originalMessage,
                                customReplies[alertId]
                              )
                            }
                            className="bg-yellow-400 hover:bg-black hover:text-yellow-400 text-black text-[10px] font-black uppercase px-2 py-0.5 border border-black transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                          >
                            {generatingAiReplies[alertId] ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            <span>✨ AI Generate Replies</span>
                          </button>
                        </div>

                        {/* Combined Quick Replies + AI Generated Replies */}
                        <div className="flex flex-wrap gap-2">
                          {(aiCustomReplies[alertId] || alert.quickReplies)?.map((r, rIdx) => (
                            <button
                              key={rIdx}
                              disabled={replyingId === alertId}
                              onClick={() => handleSendReply(alertId, r)}
                              className="text-xs bg-white hover:bg-yellow-400 font-bold px-3 py-1.5 border border-black text-black transition-colors cursor-pointer shadow-xs text-left"
                            >
                              {r}
                            </button>
                          ))}
                        </div>

                        {/* Custom Reply */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Type custom response in Hindi or English (e.g. 'Bas 2 minute mein aa raha hoon')..."
                            value={customReplies[alertId] || ''}
                            onChange={(e) =>
                              setCustomReplies((prev) => ({
                                ...prev,
                                [alertId]: e.target.value
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendReply(alertId, customReplies[alertId] || '');
                              }
                            }}
                            className="flex-1 bg-white border border-black px-3 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-yellow-400 font-medium"
                          />
                          <button
                            disabled={
                              replyingId === alertId || !customReplies[alertId]?.trim()
                            }
                            onClick={() =>
                              handleSendReply(alertId, customReplies[alertId] || '')
                            }
                            className="bg-black text-yellow-400 px-4 py-1.5 font-black uppercase text-xs border border-black hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>REPLY</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
