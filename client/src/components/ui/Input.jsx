import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`
        w-full rounded-xl px-4 py-3 text-sm
        bg-white/8 border border-white/15 text-white
        placeholder:text-white/35
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
        hover:border-white/25 transition-all
        ${className}
      `}
      {...props}
    />
  );
}
