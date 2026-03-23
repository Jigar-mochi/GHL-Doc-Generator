import React from 'react';
import Badge from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import { getAuthUrl, logout } from '../lib/api.js';

export default function Header({ authenticated, onAuthChange }) {
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
    </header>
  );
}
