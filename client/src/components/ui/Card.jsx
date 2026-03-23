import React from 'react';

export default function Card({ children, className = '', glass = true }) {
  return (
    <div
      className={`
        rounded-2xl p-6
        ${glass
          ? 'bg-white/7 backdrop-blur-xl border border-white/12 shadow-2xl'
          : 'bg-slate-800 border border-slate-700'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>;
}
