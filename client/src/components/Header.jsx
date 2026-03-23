import React from 'react';
import Badge from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import { getAuthUrl, logout } from '../lib/api.js';

export default function Header({ authenticated, onAuthChange, darkMode, setDarkMode }) {
  const handleConnect = async () => {
    try {
      const url = await getAuthUrl();
      window.location.href = url;
    } catch {
      alert('Failed to get Google auth URL. Check server configuration.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onAuthChange(false);
    } catch {
      onAuthChange(false);
    }
  };

  return (
    <header className="w-full px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-white text-lg leading-none">TAD Generator</div>
          <div className="text-white/40 text-xs mt-0.5">Go High Level</div>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Auth status */}
        {authenticated ? (
          <div className="flex items-center gap-2">
            <Badge variant="success" dot>Google Drive Connected</Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Disconnect</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="error" dot>Not Connected</Badge>
            <Button variant="secondary" size="sm" onClick={handleConnect}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M6.18 15L5.1 21l5.4-3.13L16 21l-1.08-6 4.58-4.5-6.07-.52L10.5 4 7.68 10.48 1.6 11z" />
              </svg>
              Connect Google Drive
            </Button>
          </div>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="12" r="5" />
              <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
