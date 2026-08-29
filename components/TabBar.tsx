'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface TabItem {
  name: string;
  href: string;
  iconName: 'home' | 'history' | 'planet' | 'passport' | 'profile';
}

const navItems: TabItem[] = [
  { name: 'Home', href: '/home', iconName: 'home' },
  { name: 'History', href: '/history', iconName: 'history' },
  { name: 'World', href: '/world', iconName: 'planet' },
  { name: 'Passport', href: '/passport', iconName: 'passport' },
  { name: 'Profile', href: '/profile', iconName: 'profile' },
];

export const TabBar: React.FC = () => {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const idx = navItems.findIndex(
      (item) => pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href))
    );
    if (idx !== -1) {
      setActiveIndex(idx);
    }
  }, [pathname]);

  const renderIcon = (iconName: TabItem['iconName'], isActive: boolean) => {
    switch (iconName) {
      case 'home':
        return (
          <svg
            className="w-[19px] h-[19px] transition-colors"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        );
      case 'history':
        return (
          <svg
            className="w-[19px] h-[19px] transition-colors"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'planet':
        return (
          <svg
            className="w-[19px] h-[19px] transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="6" fill={isActive ? 'currentColor' : 'none'} />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.5 15.5c4.5 3 12.5 3 17-3M6.5 8.5C11 5.5 19 5.5 20.5 8.5"
            />
          </svg>
        );
      case 'passport':
        return (
          <svg
            className="w-[19px] h-[19px] transition-colors"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        );
      case 'profile':
        return (
          <svg
            className="w-[19px] h-[19px] transition-colors"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.75"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <>
      {/* =========================================================================
          MOBILE BOTTOM TAB BAR (< 1024px)
          ========================================================================= */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-white/[0.07] bg-[#120E22]/85 backdrop-blur-[24px] saturate-[1.15]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="relative h-[62px] flex items-center justify-around px-1">
          {/* Sliding 3px Top Active Indicator Pill */}
          <div
            className="absolute top-0 h-[3px] w-6 bg-signature-gradient rounded-b-full transition-all duration-220 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              left: `calc(${(activeIndex + 0.5) * 20}% - 12px)`,
            }}
          />

          {navItems.map((item, idx) => {
            const isActive = activeIndex === idx;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 h-full min-w-[40px] min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? 'text-text' : 'text-muted hover:text-text'
                }`}
              >
                <div className={isActive ? 'text-[#00F0FF]' : 'text-muted'}>
                  {renderIcon(item.iconName, isActive)}
                </div>
                <span className="font-sans font-medium text-[9px] leading-tight tracking-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* =========================================================================
          DESKTOP LEFT SIDEBAR (>= 1024px)
          ========================================================================= */}
      <aside className="hidden lg:flex fixed top-[60px] left-0 bottom-0 w-[240px] z-20 border-r border-white/[0.07] bg-[#120E22]/60 backdrop-blur-[20px] flex-col p-4 space-y-2">
        <div className="font-mono text-[10px] tracking-eyebrow uppercase text-muted px-3 py-2 font-bold">
          NAVIGATION
        </div>
        {navItems.map((item, idx) => {
          const isActive = activeIndex === idx;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`h-11 px-3.5 rounded-[10px] flex items-center gap-3 font-sans text-sm font-medium transition-all ${
                isActive
                  ? 'bg-signature-gradient text-white font-semibold shadow-[0_4px_20px_-4px_rgba(168,85,247,0.4)]'
                  : 'text-muted hover:text-text hover:bg-raised/60'
              }`}
            >
              <div>{renderIcon(item.iconName, isActive)}</div>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </aside>
    </>
  );
};
export default TabBar;
