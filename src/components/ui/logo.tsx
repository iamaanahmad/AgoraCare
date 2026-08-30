import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function AgoraCareLogo({ className, size = 32, showText = false }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div 
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 via-emerald-500 to-cyan-400 p-1.5 shadow-md shadow-emerald-500/20"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Medical Heart Shield & Voice Waves */}
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          {/* Audio Voice Pulse Lines */}
          <path
            d="M12 7v10M8.5 9.5v5M15.5 9.5v5M5.5 11.5v1M18.5 11.5v1"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <span className="font-headline font-bold text-xl tracking-tight bg-gradient-to-r from-teal-900 via-emerald-800 to-cyan-900 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
          Agora<span className="text-emerald-500">Care</span>
        </span>
      )}
    </div>
  );
}
