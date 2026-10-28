import React from 'react';
import { X, Printer, Download, Shield, EyeOff, Sparkles } from 'lucide-react';
import { IVehicle } from '../types/index.js';

interface PlacardModalProps {
  vehicle: IVehicle | null;
  onClose: () => void;
}

export const PlacardModal: React.FC<PlacardModalProps> = ({ vehicle, onClose }) => {
  if (!vehicle) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    const a = document.createElement('a');
    a.href = vehicle.qrCodeUrl;
    a.download = `SmartTag_India_${vehicle.licensePlate.replace(/\s+/g, '_')}_QR.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static select-none">
      <div className="relative w-full max-w-xl bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden my-4 print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Modal Controls (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-black text-white border-b-4 border-yellow-400 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-blue-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs">
              IND 🇮🇳
            </span>
            <Shield className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <h3 className="font-black italic text-base uppercase text-yellow-400">
              SMART TAG WINDSHIELD PLACARD (INDIA)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs border border-yellow-500 cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT PLACARD</span>
            </button>
            <button
              onClick={handleDownloadQR}
              className="px-3 py-1.5 bg-white hover:bg-neutral-200 text-black font-black uppercase text-xs border border-black cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SAVE QR</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PLACARD CONTAINER */}
        <div className="p-6 sm:p-8 flex justify-center bg-neutral-100 print:p-2 print:bg-white">
          <div className="w-full max-w-md bg-white text-black p-6 sm:p-7 border-4 border-black shadow-[6px_6px_0px_0px_#000] print:border-4 print:border-black print:shadow-none relative">
            {/* Top Security Banner */}
            <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-black flex items-center justify-center border-2 border-yellow-400">
                  <Shield className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black italic tracking-wider text-base uppercase leading-none">
                      SMART TAG INDIA
                    </h4>
                    <span className="bg-blue-700 text-white text-[8px] font-black px-1 rounded-xs">
                      BHARAT
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-tight mt-0.5">
                    HIGH SECURITY VEHICLE CONTACT TAG
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-yellow-400 text-black text-[10px] font-black uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000]">
                  ENCRYPTED
                </span>
                <p className="font-mono text-[9px] text-neutral-500 mt-0.5">
                  ID: {vehicle.tagId.slice(0, 16)}
                </p>
              </div>
            </div>

            {/* Indian HSRP License Plate Render */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center border-2 border-black bg-white rounded shadow-sm overflow-hidden">
                <div className="bg-blue-800 text-white px-2 py-1 flex flex-col items-center justify-center border-r border-black">
                  <span className="text-[7px] font-black leading-none">INDIA</span>
                  <div className="w-2.5 h-2.5 rounded-full border border-blue-300 my-0.5 flex items-center justify-center text-[6px]">
                    ☸
                  </div>
                  <span className="text-[8px] font-black leading-none">IND</span>
                </div>
                <div className="px-3 py-1 font-mono font-black text-black text-sm tracking-widest bg-yellow-400">
                  {vehicle.licensePlate}
                </div>
              </div>
            </div>

            {/* Main Center QR Block matching Screenshot 448 */}
            <div className="text-center my-2">
              <div className="inline-block p-3.5 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#facc15]">
                <img
                  src={vehicle.qrCodeUrl}
                  alt={`SmartTag QR for ${vehicle.licensePlate}`}
                  className="w-52 h-52 mx-auto object-contain"
                />
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-black text-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span>SCAN WITH ANY PHONE CAMERA • NO APP REQUIRED</span>
              </div>
            </div>

            {/* Vehicle Reference Badge */}
            <div className="bg-neutral-100 p-3 border-2 border-black my-4 text-center">
              <p className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">
                REGISTERED VEHICLE
              </p>
              <p className="font-black text-black text-base uppercase">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="font-mono text-xs font-black text-neutral-700 tracking-wide mt-0.5">
                COLOR: {vehicle.color || 'Standard'} • RTO: {vehicle.licensePlate.slice(0, 2)}
              </p>
              {vehicle.emergencyNotes && (
                <p className="mt-2 text-[11px] font-bold text-black border-t border-neutral-300 pt-1.5">
                  ⚠️ Driver Note: {vehicle.emergencyNotes}
                </p>
              )}
            </div>

            {/* Dual Hindi & English Guidance for Indian Bystanders */}
            <div className="text-[11px] text-neutral-800 space-y-1.5 border-t-2 border-black pt-3 font-medium">
              <div className="flex items-start gap-1.5">
                <span className="font-black text-black shrink-0">🇮🇳 हिन्दी:</span>
                <p>
                  <strong>गाड़ी में कोई समस्या है?</strong> गेट ब्लॉकेज, नो-पार्किंग टोइंग, खुली खिड़की या स्क्रैच होने पर तुरंत स्कैन करें। ड्राइवर को बिना फोन नंबर जाने मैसेज पहुंचेगा।
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-black text-black shrink-0">🇬🇧 English:</span>
                <p>
                  <strong>Vehicle issue or blocking?</strong> Scan with any camera to alert owner privately without exposing phone numbers.
                </p>
              </div>
            </div>

            {/* Privacy Guarantee Footer */}
            <div className="mt-4 pt-3 border-t border-neutral-300 flex items-center justify-between text-[10px] text-neutral-600 font-bold">
              <div className="flex items-center gap-1 text-black">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Zero phone number leak</span>
              </div>
              <span>चिपकाने का स्थान: कार के अगले शीशे (Windshield) पर अंदर से लगाएं</span>
            </div>
          </div>
        </div>

        {/* Print instruction note */}
        <div className="p-4 bg-yellow-50 border-t-2 border-black text-center text-xs font-bold text-neutral-800 print:hidden">
          💡 Tip: Laminate or slip into your windshield FASTag pocket. Valid across all states & Union Territories in India.
        </div>
      </div>
    </div>
  );
};
