import React from 'react';

const variants = {
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  error:   'bg-red-500/20 text-red-300 border-red-500/30',
  info:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  default: 'bg-white/10 text-white/70 border-white/20',
};

export default function Badge({ children, variant = 'default', className = '', dot = false }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-400 animate-pulse' :
          variant === 'error'   ? 'bg-red-400' :
          variant === 'info'    ? 'bg-blue-400' : 'bg-white/50'
        }`} />
      )}
      {children}
    </span>
  );
}
