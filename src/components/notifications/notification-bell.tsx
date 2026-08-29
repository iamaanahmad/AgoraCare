'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/contexts/notification-context';
import { NotificationList } from './notification-list';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { unreadCount, permissionStatus, requestPermission } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>

          {permissionStatus !== 'granted' && (
            <div className="p-4 bg-muted/50 border-b">
              <p className="text-sm text-muted-foreground mb-2">
                Enable notifications to receive medication reminders
              </p>
              <Button
                size="sm"
                onClick={handleRequestPermission}
                className="w-full"
              >
                Enable Notifications
              </Button>
            </div>
          )}

          <NotificationList onClose={() => setIsOpen(false)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
