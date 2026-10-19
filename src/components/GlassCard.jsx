import React from 'react';

export default function GlassCard({ children, className = '', isActive = false, isPast = false, onClick }) {
  let borderStyle = 'border-white/10 hover:border-white/20';
  if (isActive) {
    borderStyle = 'border-primary ring-2 ring-primary/40 shadow-glow-blue';
  } else if (isPast) {
    borderStyle = 'border-rose-500/30';
  }

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-glass backdrop-blur-xl border ${borderStyle} p-4 md:p-5 transition-all duration-200 shadow-glass ${className}`}
    >
      {/* Subtle top glare highlight for realistic glass effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
