import React, { useState } from 'react';
import { X, Lock, Mail, Shield, AlertCircle, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी (Hindi / Hinglish)' },
  { code: 'en', label: 'English (Indian English)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { login, signup, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState('priyansh_driver');
  const [password, setPassword] = useState('password123');

  // Signup form state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('Priyansh Gupta');
  const [signupLanguage, setSignupLanguage] = useState('hi');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
        fullName: signupFullName,
        preferredLanguage: signupLanguage
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLoginClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto select-none">
      <div className="relative w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between border-b-4 border-yellow-400">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-black italic text-lg uppercase tracking-wider text-yellow-400">
              {mode === 'login' ? 'OWNER LOGIN' : 'CREATE ACCOUNT'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 border-b-2 border-black bg-neutral-100">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-yellow-400 text-black border-b-2 border-black'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 stroke-[3]" />
            <span>SIGN IN</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-yellow-400 text-black border-b-2 border-black'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[3]" />
            <span>REGISTER</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Login Option */}
          <button
            type="button"
            onClick={handleDemoLoginClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-black fill-black" />
            <span>1-CLICK DEMO LOGIN (ALEX MERCER)</span>
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-neutral-300 w-full" />
            <span className="bg-white px-2 text-[10px] text-neutral-500 font-black uppercase">
              OR YOUR CREDENTIALS
            </span>
            <div className="border-t border-neutral-300 w-full" />
          </div>

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  USERNAME OR EMAIL
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="alex_driver or alex@smarttag.dev"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-black text-sm text-black font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-black text-sm text-black font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase tracking-wider text-sm border-2 border-black transition-all shadow-[4px_4px_0px_0px_#000] cursor-pointer mt-2"
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN WITH JWT'}
              </button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    USERNAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. driver_john"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="w-full p-2 border-2 border-black text-xs font-semibold text-black bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="w-full p-2 border-2 border-black text-xs font-semibold text-black bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full p-2 border-2 border-black text-xs font-semibold text-black bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  PASSWORD (MIN 6 CHARS) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full p-2 border-2 border-black text-xs font-semibold text-black bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  PREFERRED LANGUAGE
                </label>
                <select
                  value={signupLanguage}
                  onChange={(e) => setSignupLanguage(e.target.value)}
                  className="w-full p-2 border-2 border-black text-xs font-bold text-black bg-white focus:outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black uppercase tracking-wider text-sm border-2 border-black transition-all shadow-[4px_4px_0px_0px_#000] cursor-pointer mt-2"
              >
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
