'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmergencyButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline';
}

export function EmergencyButton({
  onClick,
  className,
  size = 'default',
  variant = 'destructive',
}: EmergencyButtonProps) {
  return (
    <Button
      onClick={onClick}
      size={size}
      variant={variant}
      className={cn(
        'font-bold transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'shadow-lg hover:shadow-xl',
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 mr-2" />
      Emergency
    </Button>
  );
}

/**
 * Large emergency button for dashboard or main interface
 */
export function EmergencyButtonLarge({
  onClick,
  className,
}: Omit<EmergencyButtonProps, 'size' | 'variant'>) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        'h-24 text-2xl font-bold flex flex-col gap-2',
        'bg-red-600 hover:bg-red-700 text-white',
        'transition-all duration-200 transform hover:scale-105',
        'shadow-xl hover:shadow-2xl',
        'border-4 border-red-700',
        className
      )}
    >
      <AlertTriangle className="h-10 w-10 animate-pulse" />
      <span>Emergency</span>
    </Button>
  );
}

/**
 * Floating emergency button that stays visible
 */
export function EmergencyButtonFloating({
  onClick,
  className,
}: Omit<EmergencyButtonProps, 'size' | 'variant'>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'w-16 h-16 rounded-full',
        'bg-red-600 hover:bg-red-700 text-white',
        'shadow-2xl hover:shadow-3xl',
        'flex items-center justify-center',
        'transition-all duration-200 transform hover:scale-110',
        'border-4 border-red-700',
        'animate-pulse',
        className
      )}
      aria-label="Emergency"
    >
      <AlertTriangle className="h-8 w-8" />
    </button>
  );
}
