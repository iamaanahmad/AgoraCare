'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Pill, Calendar, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/notification-context';
import { NotificationData } from '@/firebase/firestore/notifications';
import { cn } from '@/lib/utils';

interface NotificationListProps {
  onClose?: () => void;
}

export function NotificationList({ onClose }: NotificationListProps) {
  const router = useRouter();
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose?.();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'medication-reminder':
        return <Pill className="h-5 w-5 text-blue-500" />;
      case 'medication-missed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'appointment-reminder':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No notifications</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {notifications.some((n) => !n.read) && (
        <div className="px-4 py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="w-full"
          >
            Mark all as read
          </Button>
        </div>
      )}

      <ScrollArea className="h-[400px]">
        <div className="divide-y">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                'w-full p-4 text-left hover:bg-muted/50 transition-colors',
                !notification.read && 'bg-blue-50/50 dark:bg-blue-950/20'
              )}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    {!notification.read && (
                      <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500"></span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.body}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(notification.scheduledFor, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
