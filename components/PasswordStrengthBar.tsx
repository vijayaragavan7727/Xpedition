'use client';

import React from 'react';

interface PasswordStrengthBarProps {
  password?: string;
}

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ password = '' }) => {
  const calculateStrength = (pwd: string): { score: number; label: string; colorClass: string } => {
    if (!pwd) return { score: 0, label: 'TOO SHORT', colorClass: 'bg-line' };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'WEAK', colorClass: 'bg-red' };
      case 2:
        return { score: 2, label: 'FAIR', colorClass: 'bg-orange-500' };
      case 3:
        return { score: 3, label: 'GOOD', colorClass: 'bg-cyan-city' };
      case 4:
        return { score: 4, label: 'STRONG', colorClass: 'bg-emerald-500' };
      default:
        return { score: 1, label: 'WEAK', colorClass: 'bg-red' };
    }
  };

  const { score, label, colorClass } = calculateStrength(password);

  return (
    <div className="space-y-1 pt-1">
      <div className="flex items-center justify-between text-[9px] font-mono tracking-eyebrow text-muted uppercase">
        <span>PASSWORD STRENGTH</span>
        <span className={score > 0 ? 'text-text font-bold' : 'text-muted'}>{password ? label : '—'}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-colors duration-300 ${
              step <= score ? colorClass : 'bg-line/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
