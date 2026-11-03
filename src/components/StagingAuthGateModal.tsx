import React, { useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface StagingAuthGateModalProps {
  isOpen: boolean;
  onAuthenticated: (userType: 'client' | 'developer') => void;
  isNightShiftMode: boolean;
}

export const StagingAuthGateModal: React.FC<StagingAuthGateModalProps> = ({
  isOpen,
  onAuthenticated,
  isNightShiftMode,
}) => {
  useBodyScrollLock(isOpen);

  const [username, setUsername] = useState('lawrence');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const u = username.trim().toLowerCase();
      const p = password.trim();

      if (u === 'lawrence' && p === 'np-preview-2026') {
        sessionStorage.setItem('np_staging_auth_lawrence', 'true');
        sessionStorage.setItem('np_staging_user', 'client');
        onAuthenticated('client');
      } else if (
        (u === 'developer' || u === 'joshua') &&
        (p === 'np-dev-2026' || p === 'np-preview-2026')
      ) {
        sessionStorage.setItem('np_staging_auth_lawrence', 'true');
        sessionStorage.setItem('np_staging_user', 'developer');
        onAuthenticated('developer');
      } else if (u === 'admin' && p === 'nursespillow2026') {
        sessionStorage.setItem('np_staging_auth_lawrence', 'true');
        sessionStorage.setItem('np_staging_user', 'developer');
        onAuthenticated('developer');
      } else {
        setError('Invalid username or password.');
      }
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto pt-16 sm:pt-20 bg-[#0B2559]/80 backdrop-blur-sm flex items-start justify-center p-4">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-xl border transition-colors ${
          isNightShiftMode
            ? 'bg-[#0B1626] border-[#233550] text-[#E6ECF7]'
            : 'bg-white border-[rgba(11,37,89,0.08)] text-[#0B2559]'
        }`}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0A6FA8]/10 dark:bg-[#0A6FA8]/20 flex items-center justify-center text-[#0A6FA8] dark:text-[#3E9AD1] mb-3">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h2 className="text-lg font-bold">Authentication required</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Staging environment
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-2.5 rounded-xl bg-[#F4E2DC] text-[#A8452E] text-xs font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors outline-none border ${
                isNightShiftMode
                  ? 'bg-[#15233a] border-[#233550] text-white focus:border-[#3E9AD1]'
                  : 'bg-[#EFF6FB] border-transparent text-[#0B2559] focus:border-[#0A6FA8] focus:bg-white'
              }`}
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm transition-colors outline-none border ${
                  isNightShiftMode
                    ? 'bg-[#15233a] border-[#233550] text-white focus:border-[#3E9AD1]'
                    : 'bg-[#EFF6FB] border-transparent text-[#0B2559] focus:border-[#0A6FA8] focus:bg-white'
                }`}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </div>
        </form>

        {/* SEO robots notice */}
        <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
          <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
            noindex, nofollow
          </span>
        </div>
      </div>
    </div>
  );
};
