import React from 'react';

export default function Progress({ value = 0, className = '' }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`w-full bg-white/10 rounded-full h-1.5 overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
