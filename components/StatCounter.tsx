'use client';

import React, { useEffect, useState } from 'react';

interface StatCounterProps {
  end: number;
  prefix?: string;
  suffix?: string;
  decimalText?: string; // e.g., ".9"
  percentSymbol?: boolean;
  duration?: number;
  delayMs?: number;
  label: string;
}

export const StatCounter: React.FC<StatCounterProps> = ({
  end,
  prefix = '',
  suffix = '',
  decimalText,
  percentSymbol = false,
  duration = 1200,
  delayMs = 480,
  label,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    const timer = setTimeout(() => {
      let startTime: number | null = null;
      let animationFrameId: number;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(easeProgress * end));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationFrameId);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [end, duration, delayMs]);

  return (
    <div className="flex flex-col">
      <div className="font-mono text-xl sm:text-2xl font-bold text-text tracking-tight flex items-baseline">
        {prefix && <span className="text-red-hot">{prefix}</span>}
        <span>{count.toLocaleString()}</span>
        {decimalText && <span className="text-red">{decimalText}</span>}
        {percentSymbol && (
          <span className="font-mono text-[60%] text-muted ml-0.5 font-normal">%</span>
        )}
        {suffix && <span className="text-red">{suffix}</span>}
      </div>
      <div className="font-mono text-[10px] tracking-eyebrow uppercase text-muted mt-0.5">
        {label}
      </div>
    </div>
  );
};
