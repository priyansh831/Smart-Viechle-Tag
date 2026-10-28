import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { HeroLanding } from './components/HeroLanding.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ScanPage } from './pages/ScanPage.js';
import { RegistrationModal } from './components/RegistrationModal.js';
import { PlacardModal } from './components/PlacardModal.js';
import { DamageModal } from './components/DamageModal.js';
import { HowItWorksModal } from './components/HowItWorksModal.js';
import { AuthModal } from './components/AuthModal.js';
import { IVehicle, IAlert, IDamageReport } from './types/index.js';
import { getSocket } from './services/socket.js';

function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.24); // D6

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // Audio autoplay restrictions before user gesture
  }
}

function MainApp() {
  const { user, logout, authFetch } = useAuth();

  // Navigation: 'landing' | 'dashboard' | 'scan' | 'how'
  const [currentTab, setCurrentTab] = useState<'landing' | 'dashboard' | 'scan' | 'how'>('landing');
  const [scanTagId, setScanTagId] = useState<string>('');

  // Data state
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // WebSocket state
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [latestPushedAlert, setLatestPushedAlert] = useState<IAlert | null>(null);
  const [unreadAlertIds, setUnreadAlertIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [placardVehicle, setPlacardVehicle] = useState<IVehicle | null>(null);
  const [damageReportData, setDamageReportData] = useState<{
    report: IDamageReport;
    vehicleSummary?: string;
  } | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Parse path on initial load (e.g., /scan/:tagId)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/scan/')) {
      const parts = path.split('/scan/');
      if (parts[1]) {
        setScanTagId(parts[1]);
        setCurrentTab('scan');
      }
    } else if (user) {
      setCurrentTab('dashboard');
    }
  }, [user]);

  // Fetch Vehicles using authFetch
  const fetchVehicles = useCallback(async () => {
    try {
      const res = await authFetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
        if (data.vehicles?.length > 0 && !scanTagId) {
          setScanTagId(data.vehicles[0].tagId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  }, [authFetch, scanTagId]);

  // Fetch Alerts using authFetch
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await authFetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // Initial load on mount and when user logs in/out
  useEffect(() => {
    fetchVehicles();
    fetchAlerts();
  }, [fetchVehicles, fetchAlerts, user]);

  // REAL-TIME WEBSOCKET SUBSCRIPTION (Socket.IO)
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setWsConnected(true);
      socket.emit('join:dashboard', { userId: user?.id });
    };

    const handleDisconnect = () => {
      setWsConnected(false);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }
    socket.on('disconnect', handleDisconnect);

    // Incoming new emergency alert
    const handleNewAlert = (newAlert: IAlert) => {
      const alertId = newAlert._id || newAlert.id || '';
      playAlertChime();

      setLatestPushedAlert(newAlert);
      setUnreadAlertIds((prev) => new Set(prev).add(alertId));

      setAlerts((prev) => {
        const exists = prev.some((a) => (a._id || a.id) === alertId);
        if (exists) {
          return prev.map((a) => ((a._id || a.id) === alertId ? newAlert : a));
        }
        return [newAlert, ...prev];
      });
    };

    // Owner response broadcast
    const handleReplyAlert = (updatedAlert: IAlert) => {
      const alertId = updatedAlert._id || updatedAlert.id || '';
      setAlerts((prev) =>
        prev.map((a) => ((a._id || a.id) === alertId ? updatedAlert : a))
      );
    };

    // Alert status update broadcast
    const handleUpdateAlert = (updatedAlert: IAlert) => {
      const alertId = updatedAlert._id || updatedAlert.id || '';
      setAlerts((prev) =>
        prev.map((a) => ((a._id || a.id) === alertId ? updatedAlert : a))
      );
    };

    socket.on('alert:new', handleNewAlert);
    socket.on('alert:reply', handleReplyAlert);
    socket.on('alert:update', handleUpdateAlert);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('alert:new', handleNewAlert);
      socket.off('alert:reply', handleReplyAlert);
      socket.off('alert:update', handleUpdateAlert);
    };
  }, [user]);

  // Handle owner reply to an alert
  const handleReplyAlert = async (alertId: string, replyMessage: string) => {
    try {
      const res = await authFetch(`/api/alerts/${alertId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyMessage,
          status: 'ACKNOWLEDGED'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) =>
          prev.map((a) => ((a._id || a.id) === alertId ? data.alert : a))
        );
        setUnreadAlertIds((prev) => {
          const next = new Set(prev);
          next.delete(alertId);
          return next;
        });
      }
    } catch (err) {
      console.error('Error sending reply to alert:', err);
    }
  };

  // Handle deleting a vehicle
  const handleDeleteVehicle = async (tagId: string) => {
    try {
      const res = await authFetch(`/api/vehicles/${tagId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setVehicles((prev) => prev.filter((v) => v.tagId !== tagId));
        setAlerts((prev) => prev.filter((a) => a.tagId !== tagId));
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    }
  };

  const handleVehicleCreated = (newVehicle: IVehicle) => {
    setVehicles((prev) => [newVehicle, ...prev]);
    setScanTagId(newVehicle.tagId);
  };

  const handleSelectVehicleToScan = (tagId: string) => {
    setScanTagId(tagId);
    setCurrentTab('scan');
    window.history.pushState({}, '', `/scan/${tagId}`);
  };

  const handleTabChange = (tab: 'landing' | 'dashboard' | 'scan' | 'how') => {
    if (tab === 'how') {
      setIsHowItWorksOpen(true);
      return;
    }
    setCurrentTab(tab);
    if (tab === 'landing') {
      window.history.pushState({}, '', '/');
    } else if (tab === 'dashboard') {
      window.history.pushState({}, '', '/');
    } else if (tab === 'scan') {
      const activeTag = scanTagId || (vehicles[0]?.tagId ?? 'demo');
      window.history.pushState({}, '', `/scan/${activeTag}`);
    }
  };

  const pendingAlertCount = alerts.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        onOpenRegister={() => setIsRegisterOpen(true)}
        pendingAlertCount={pendingAlertCount}
        availableVehicles={vehicles}
        onSelectVehicleToScan={handleSelectVehicleToScan}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
        wsConnected={wsConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {currentTab === 'landing' ? (
          <div>
            <HeroLanding
              onGetStarted={() => {
                if (user) {
                  setCurrentTab('dashboard');
                } else {
                  setIsAuthOpen(true);
                }
              }}
              onViewDemo={() => {
                setCurrentTab('dashboard');
              }}
            />
            {/* Show dashboard preview directly below hero for immediate instant utility */}
            <DashboardPage
              vehicles={vehicles}
              alerts={alerts}
              loading={loading}
              onOpenRegister={() => setIsRegisterOpen(true)}
              onOpenPlacard={(v) => setPlacardVehicle(v)}
              onOpenDamageModal={(rep, sum) =>
                setDamageReportData({ report: rep, vehicleSummary: sum })
              }
              onSelectVehicleToScan={handleSelectVehicleToScan}
              onDeleteVehicle={handleDeleteVehicle}
              onReplyAlert={handleReplyAlert}
              onRefreshAlerts={fetchAlerts}
              user={user}
              onOpenAuth={() => setIsAuthOpen(true)}
              latestPushedAlert={latestPushedAlert}
              onDismissPushedAlert={() => setLatestPushedAlert(null)}
              unreadAlertIds={unreadAlertIds}
              onVehicleCreatedDirect={handleVehicleCreated}
            />
          </div>
        ) : currentTab === 'dashboard' ? (
          <DashboardPage
            vehicles={vehicles}
            alerts={alerts}
            loading={loading}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenPlacard={(v) => setPlacardVehicle(v)}
            onOpenDamageModal={(rep, sum) =>
              setDamageReportData({ report: rep, vehicleSummary: sum })
            }
            onSelectVehicleToScan={handleSelectVehicleToScan}
            onDeleteVehicle={handleDeleteVehicle}
            onReplyAlert={handleReplyAlert}
            onRefreshAlerts={fetchAlerts}
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
            latestPushedAlert={latestPushedAlert}
            onDismissPushedAlert={() => setLatestPushedAlert(null)}
            unreadAlertIds={unreadAlertIds}
            onVehicleCreatedDirect={handleVehicleCreated}
          />
        ) : (
          <ScanPage
            tagId={scanTagId || (vehicles[0]?.tagId ?? '')}
            onBackToDashboard={() => handleTabChange('dashboard')}
            availableVehicles={vehicles}
            onSwitchTag={(newTag) => {
              setScanTagId(newTag);
              window.history.pushState({}, '', `/scan/${newTag}`);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onVehicleCreated={handleVehicleCreated}
        onOpenPlacard={(v) => setPlacardVehicle(v)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <PlacardModal
        vehicle={placardVehicle}
        onClose={() => setPlacardVehicle(null)}
      />

      <DamageModal
        damageReport={damageReportData?.report || null}
        vehicleSummary={damageReportData?.vehicleSummary}
        onClose={() => setDamageReportData(null)}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onStartRegistration={() => setIsRegisterOpen(true)}
      />

      {/* Footer matching Screenshot 446 & 448 theme */}
      <footer className="border-t-2 border-black bg-black text-white py-6 mt-12 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-black italic uppercase tracking-wider text-yellow-400">
            SMART TAG • PRIVACY-FIRST VEHICLE EMERGENCY SYSTEM
          </p>
          <div className="flex items-center gap-2 text-neutral-400 font-bold text-xs uppercase">
            <span>SOCKET.IO REAL-TIME</span>
            <span>•</span>
            <span className="text-yellow-400">GEMINI VISION & AI TRANSLATION</span>
            <span>•</span>
            <span>JWT AUTH & GPS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
