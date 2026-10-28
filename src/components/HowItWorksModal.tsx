import React from 'react';
import { X, ShieldCheck, QrCode, Sparkles, Zap, EyeOff, Camera } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRegistration: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartRegistration
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-black text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 text-black flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-black italic uppercase tracking-wider text-yellow-400 text-base">
                HOW SMART TAG WORKS
              </h3>
              <p className="text-xs text-neutral-300 font-bold">Zero-leak privacy vehicle emergency communication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="p-4 border-2 border-black bg-neutral-50 shadow-[4px_4px_0px_0px_#000]">
              <div className="w-7 h-7 bg-yellow-400 text-black font-black flex items-center justify-center text-xs mb-2 border border-black">
                1
              </div>
              <h4 className="font-black uppercase text-black text-sm mb-1 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-black" />
                Register & Place Tag
              </h4>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Add your vehicle details. SmartTag generates a unique encrypted QR tag that you print and place on your windshield.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 border-2 border-black bg-neutral-50 shadow-[4px_4px_0px_0px_#000]">
              <div className="w-7 h-7 bg-yellow-400 text-black font-black flex items-center justify-center text-xs mb-2 border border-black">
                2
              </div>
              <h4 className="font-black uppercase text-black text-sm mb-1 flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-black" />
                Zero-Leak Bystander Scan
              </h4>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Anyone can scan your windshield tag with their smartphone. No app needed. Your phone number is 100% hidden.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 border-2 border-black bg-neutral-50 shadow-[4px_4px_0px_0px_#000]">
              <div className="w-7 h-7 bg-yellow-400 text-black font-black flex items-center justify-center text-xs mb-2 border border-black">
                3
              </div>
              <h4 className="font-black uppercase text-black text-sm mb-1 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-black" />
                Gemini AI Vision & Translation
              </h4>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Bystander messages in any language are translated instantly. Uploaded photos are analyzed by Gemini for damage severity.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 border-2 border-black bg-neutral-50 shadow-[4px_4px_0px_0px_#000]">
              <div className="w-7 h-7 bg-yellow-400 text-black font-black flex items-center justify-center text-xs mb-2 border border-black">
                4
              </div>
              <h4 className="font-black uppercase text-black text-sm mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-black" />
                Instant 1-Tap Quick Replies
              </h4>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Receive live WebSocket alerts on your dashboard and respond with 1 tap. The bystander sees your reply instantly.
              </p>
            </div>
          </div>

          <div className="p-4 bg-yellow-400 border-2 border-black flex items-center gap-3 shadow-[4px_4px_0px_0px_#000]">
            <Sparkles className="w-6 h-6 text-black shrink-0" />
            <div className="text-xs text-black font-bold">
              <strong>Why SmartTag India?</strong> Avoid traffic police towing challans, society gate disputes, or rain damage without ever exposing your private mobile number on a paper slip on your windshield.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-black bg-neutral-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-black hover:underline font-black uppercase text-xs tracking-wider"
          >
            Got it
          </button>
          <button
            onClick={() => {
              onClose();
              onStartRegistration();
            }}
            className="px-5 py-2.5 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase text-xs tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all cursor-pointer"
          >
            REGISTER VEHICLE NOW
          </button>
        </div>
      </div>
    </div>
  );
};
