import React from 'react';
import { X, AlertTriangle, CheckCircle, ShieldAlert, Car, Wrench, Download, Sparkles } from 'lucide-react';
import { IDamageReport } from '../types/index.js';

interface DamageModalProps {
  damageReport: IDamageReport | null;
  vehicleSummary?: string;
  onClose: () => void;
}

export const DamageModal: React.FC<DamageModalProps> = ({
  damageReport,
  vehicleSummary,
  onClose
}) => {
  if (!damageReport) return null;

  const severityBadge = {
    Critical: 'bg-red-600 text-white',
    Medium: 'bg-yellow-400 text-black',
    Low: 'bg-black text-yellow-400',
    None: 'bg-neutral-200 text-black'
  }[damageReport.severity || 'Medium'];

  const handleDownloadImage = () => {
    if (!damageReport.imageUrl) return;
    const a = document.createElement('a');
    a.href = damageReport.imageUrl;
    a.download = `Damage_Evidence_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-black text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 text-black flex items-center justify-center font-black">
              <ShieldAlert className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black italic uppercase tracking-wider text-yellow-400 text-base">
                  VISUAL DAMAGE ASSESSMENT
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-white text-black px-2 py-0.5 border border-yellow-400">
                  <Sparkles className="w-3 h-3 text-black" /> GEMINI VISION
                </span>
              </div>
              <p className="text-xs text-neutral-300 font-bold">{vehicleSummary || 'Vehicle Diagnostic Inspection'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Photo Preview */}
          {damageReport.imageUrl ? (
            <div className="relative border-2 border-black bg-neutral-900 group">
              <img
                src={damageReport.imageUrl}
                alt="Bystander uploaded damage"
                className="w-full max-h-80 object-contain mx-auto"
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  onClick={handleDownloadImage}
                  className="px-4 py-2 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-2 border-yellow-400 transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Evidence</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-black text-center text-neutral-700 text-sm font-bold">
              No photograph was submitted with this report.
            </div>
          )}

          {/* Severity & Drivability Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-black bg-neutral-50 flex items-center gap-3 shadow-[4px_4px_0px_0px_#000]">
              <AlertTriangle className="w-6 h-6 shrink-0 text-black" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
                  Assessed Severity
                </p>
                <span className={`inline-block px-2 py-0.5 text-xs font-black uppercase mt-1 ${severityBadge}`}>
                  {damageReport.severity || 'Medium'} Severity
                </span>
              </div>
            </div>

            <div className="p-4 border-2 border-black bg-neutral-50 flex items-center gap-3 shadow-[4px_4px_0px_0px_#000]">
              {damageReport.drivable ? (
                <div className="w-8 h-8 bg-green-500 text-white flex items-center justify-center shrink-0 border border-black">
                  <CheckCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-red-600 text-white flex items-center justify-center shrink-0 border border-black">
                  <Wrench className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
                  Drivability Status
                </p>
                <p className="text-sm font-black uppercase text-black">
                  {damageReport.drivable ? 'Appears Safely Drivable' : 'Towing / Inspection Advised'}
                </p>
              </div>
            </div>
          </div>

          {/* Identified Parts Affected */}
          {damageReport.affectedParts && damageReport.affectedParts.length > 0 && (
            <div>
              <p className="text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-black" />
                <span>Impacted Components Identified by Gemini</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {damageReport.affectedParts.map((part, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-black text-yellow-400 font-mono text-xs font-bold uppercase border border-black"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Structural Impact & Summary */}
          <div className="space-y-3 bg-neutral-100 p-4 border-2 border-black">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600">Structural Diagnostic</p>
              <p className="text-sm text-black font-bold mt-0.5">
                {damageReport.structuralImpact || 'Visual impact captured.'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600">AI Summary</p>
              <p className="text-sm text-neutral-800 font-medium mt-0.5">{damageReport.summary}</p>
            </div>

            {damageReport.recommendations && (
              <div className="pt-2 border-t border-black/20">
                <p className="text-[11px] font-black uppercase tracking-wider text-black">Driver Recommendation</p>
                <p className="text-xs text-neutral-800 font-medium mt-0.5">{damageReport.recommendations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-black bg-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase text-xs tracking-wider border-2 border-black transition-colors shadow-[2px_2px_0px_0px_#000]"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
