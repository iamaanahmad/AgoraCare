'use client';

import { AlertTriangle, Phone, Users, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type EmergencyStatus = 
  | 'idle'
  | 'triggered'
  | 'calling'
  | 'notifying'
  | 'completed'
  | 'failed';

interface EmergencyStatusIndicatorProps {
  status: EmergencyStatus;
  message?: string;
  timestamp?: Date;
  className?: string;
}

export function EmergencyStatusIndicator({
  status,
  message,
  timestamp,
  className,
}: EmergencyStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'triggered':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          label: 'Emergency Triggered',
          animate: 'animate-pulse',
        };
      case 'calling':
        return {
          icon: Phone,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-500',
          label: 'Calling...',
          animate: 'animate-pulse',
        };
      case 'notifying':
        return {
          icon: Users,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-500',
          label: 'Notifying Contacts',
          animate: 'animate-pulse',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          label: 'Emergency Handled',
          animate: '',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          label: 'Emergency Failed',
          animate: '',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config || status === 'idle') return null;

  const Icon = config.icon;

  return (
    <Card className={cn('border-2', config.borderColor, config.bgColor, className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(config.animate)}>
            <Icon className={cn('h-6 w-6', config.color)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('font-semibold', config.color)}>
                {config.label}
              </Badge>
              {timestamp && (
                <span className="text-xs text-muted-foreground">
                  {timestamp.toLocaleTimeString()}
                </span>
              )}
            </div>
            {message && (
              <p className="text-sm mt-1 text-muted-foreground">{message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for header/navbar
 */
export function EmergencyStatusBadge({
  status,
  className,
}: Pick<EmergencyStatusIndicatorProps, 'status' | 'className'>) {
  if (status === 'idle') return null;

  const isActive = ['triggered', 'calling', 'notifying'].includes(status);

  return (
    <Badge
      variant={isActive ? 'destructive' : 'secondary'}
      className={cn(
        'font-semibold',
        isActive && 'animate-pulse',
        className
      )}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Emergency Active
    </Badge>
  );
}
