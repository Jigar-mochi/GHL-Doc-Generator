import React from 'react';

export default function Label({ children, className = '', ...props }) {
  return (
    <label
      className={`block text-sm font-medium text-white/70 mb-1.5 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
