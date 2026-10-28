import React from 'react';
import { Shield, QrCode, LogOut, Radio, Car } from 'lucide-react';
import { IUser } from '../types/index.js';

interface NavbarProps {
  currentTab: 'landing' | 'dashboard' | 'scan' | 'how';
  onSelectTab: (tab: 'landing' | 'dashboard' | 'scan' | 'how') => void;
  onOpenRegister: () => void;
  pendingAlertCount: number;
  availableVehicles: Array<{ tagId: string; make: string; model: string }>;
  onSelectVehicleToScan: (tagId: string) => void;
  user: IUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  wsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenRegister,
  pendingAlertCount,
  availableVehicles,
  onSelectVehicleToScan,
  user,
  onOpenAuth,
  onLogout,
  wsConnected
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand matching Screenshot 446 & 448 */}
          <div
            onClick={() => onSelectTab(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {/* Solid yellow shield icon */}
            <div className="w-7 h-7 flex items-center justify-center">
              <Shield className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black italic text-xl tracking-wider text-yellow-400 uppercase">
                SMART TAG
              </span>
              <span className="bg-blue-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-xs">
                IND 🇮🇳
              </span>
            </div>
          </div>

          {/* Right Navigation & Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live WS Status Pill */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider border ${
                wsConnected
                  ? 'border-yellow-400/50 text-yellow-400 bg-yellow-400/10'
                  : 'border-neutral-700 text-neutral-400'
              }`}
              title={wsConnected ? 'Socket.IO live stream connected' : 'Connecting to push stream...'}
            >
              <Radio className={`w-3 h-3 ${wsConnected ? 'animate-pulse text-yellow-400' : 'text-neutral-500'}`} />
              <span>{wsConnected ? 'Live' : 'Connecting'}</span>
            </div>

            {/* Quick Bystander Scan simulator button */}
            <button
              onClick={() => {
                if (availableVehicles.length > 0) {
                  onSelectVehicleToScan(availableVehicles[0].tagId);
                } else {
                  onSelectTab('scan');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${
                currentTab === 'scan'
                  ? 'text-yellow-400 border border-yellow-400'
                  : 'text-neutral-300 hover:text-yellow-400'
              }`}
              title="Test bystander QR code scan"
            >
              <QrCode className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden sm:inline">Scan Demo</span>
            </button>

            {/* If logged in: DASHBOARD link + LOGOUT button (matching Screenshot 448) */}
            {user ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`text-xs sm:text-sm font-black uppercase tracking-wider transition-colors ${
                    currentTab === 'dashboard'
                      ? 'text-yellow-400 underline decoration-2 underline-offset-4'
                      : 'text-neutral-300 hover:text-yellow-400'
                  }`}
                >
                  DASHBOARD
                  {pendingAlertCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-600 text-white font-black rounded-none">
                      {pendingAlertCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={onLogout}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs px-3.5 py-2 flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Logout of SmartTag"
                >
                  <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>LOGOUT</span>
                </button>
              </div>
            ) : (
              /* If logged out: OWNER LOGIN button (matching Screenshot 446) */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className="hidden sm:block text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-yellow-400 transition-colors"
                >
                  DASHBOARD
                </button>
                <button
                  onClick={onOpenAuth}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs sm:text-sm tracking-wider px-4 sm:px-5 py-2 sm:py-2.5 transition-all shadow-sm"
                >
                  OWNER LOGIN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Iconic Vibrant Yellow Divider Stripe (matches screenshots 446 & 448) */}
      <div className="h-1 bg-yellow-400 w-full" />
    </header>
  );
};
