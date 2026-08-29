'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Appointment } from '@/firebase/firestore/appointments';
import { CalendarEvent } from '@/lib/calendar/types';
import { useCalendarSync } from '@/hooks/use-calendar-sync';
import { useToast } from '@/hooks/use-toast';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

interface UnifiedCalendarViewProps {
  appointments: Appointment[];
  userId: string;
  profileId: string;
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onExternalEventClick?: (event: CalendarEvent) => void;
}

type EventSource = 'agoracare' | 'google' | 'outlook';

interface CalendarDay {
  date: Date;
  appointments: Appointment[];
  externalEvents: CalendarEvent[];
}

export function UnifiedCalendarView({
  appointments,
  userId,
  profileId,
  onDateSelect,
  onAppointmentClick,
  onExternalEventClick,
}: UnifiedCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [externalEvents, setExternalEvents] = useState<CalendarEvent[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleSources, setVisibleSources] = useState<Set<EventSource>>(
    new Set(['agoracare', 'google', 'outlook'])
  );
  
  const { syncing, triggerSync, fetchExternalEvents, getSyncStatus, isConnected, error: syncError } = useCalendarSync(userId);
  const { toast } = useToast();

  const syncStatus = getSyncStatus();

  useEffect(() => {
    loadExternalEvents();
  }, [userId]);

  const loadExternalEvents = async () => {
    try {
      const events = await fetchExternalEvents();
      setExternalEvents(events);
    } catch (error) {
      console.error('Error loading external events:', error);
      toast({
        title: 'Failed to Load Events',
        description: 'Could not load external calendar events. Please try syncing again.',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async () => {
    try {
      await triggerSync(profileId);
      await loadExternalEvents();
      toast({
        title: 'Sync Complete',
        description: 'Your calendars have been synchronized',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to synchronize calendars. Please check your connection and try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleSource = (source: EventSource) => {
    const newSources = new Set(visibleSources);
    if (newSources.has(source)) {
      newSources.delete(source);
    } else {
      newSources.add(source);
    }
    setVisibleSources(newSources);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const calendarData = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    
    calendarDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      map.set(dateKey, {
        date: day,
        appointments: [],
        externalEvents: [],
      });
    });

    // Add AgoraCare appointments
    if (visibleSources.has('agoracare')) {
      appointments.forEach((appointment) => {
        const dateKey = format(appointment.dateTime, 'yyyy-MM-dd');
        const dayData = map.get(dateKey);
        if (dayData) {
          dayData.appointments.push(appointment);
        }
      });
    }

    // Add external events
    externalEvents.forEach((event) => {
      const provider = event.provider;
      if (visibleSources.has(provider)) {
        const dateKey = format(event.startTime, 'yyyy-MM-dd');
        const dayData = map.get(dateKey);
        if (dayData) {
          dayData.externalEvents.push(event);
        }
      }
    });

    return map;
  }, [calendarDays, appointments, externalEvents, visibleSources]);

  const getEventsForDay = (date: Date): CalendarDay => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return calendarData.get(dateKey) || { date, appointments: [], externalEvents: [] };
  };

  const hasGoogleConnected = isConnected('google');
  const hasOutlookConnected = isConnected('outlook');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Unified Calendar
            </CardTitle>
            <CardDescription>{format(currentMonth, 'MMMM yyyy')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sync Status Indicators */}
        <div className="flex items-center gap-4 mt-4">
          {syncStatus.map((status) => (
            <div key={status.provider} className="flex items-center gap-2">
              {status.connected && status.syncEnabled ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground capitalize">
                {status.provider}
                {status.lastSync && ` (${format(status.lastSync, 'MMM d, h:mm a')})`}
              </span>
            </div>
          ))}
          {syncError && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{syncError}</span>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Event Sources</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={visibleSources.has('agoracare') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSource('agoracare')}
              >
                AgoraCare Appointments
              </Button>
              {hasGoogleConnected && (
                <Button
                  variant={visibleSources.has('google') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSource('google')}
                >
                  Google Calendar
                </Button>
              )}
              {hasOutlookConnected && (
                <Button
                  variant={visibleSources.has('outlook') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSource('outlook')}
                >
                  Outlook Calendar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dayData = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const hasEvents = dayData.appointments.length > 0 || dayData.externalEvents.length > 0;
            const totalEvents = dayData.appointments.length + dayData.externalEvents.length;

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect && onDateSelect(day)}
                className={`
                  min-h-[100px] p-2 rounded-lg border text-left transition-colors
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/50 text-muted-foreground'}
                  ${isToday ? 'border-primary border-2' : 'border-border'}
                  ${hasEvents ? 'hover:bg-accent' : 'hover:bg-muted'}
                `}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-primary' : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex-1 space-y-1">
                    {/* AgoraCare appointments */}
                    {dayData.appointments.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick && onAppointmentClick(appointment);
                        }}
                        className={`
                          text-xs p-1 rounded truncate cursor-pointer
                          bg-primary/10 text-primary hover:bg-primary/20
                        `}
                        title={`${format(appointment.dateTime, 'h:mm a')} - ${appointment.doctorName}`}
                      >
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span className="truncate">{format(appointment.dateTime, 'h:mm a')}</span>
                        </div>
                      </div>
                    ))}

                    {/* External events */}
                    {dayData.externalEvents.slice(0, 2 - Math.min(dayData.appointments.length, 2)).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onExternalEventClick && onExternalEventClick(event);
                        }}
                        className={`
                          text-xs p-1 rounded truncate cursor-pointer
                          ${event.provider === 'google' 
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                          }
                        `}
                        title={`${format(event.startTime, 'h:mm a')} - ${event.summary}`}
                      >
                        <div className="flex items-center gap-1">
                          <div 
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              event.provider === 'google' ? 'bg-blue-500' : 'bg-orange-500'
                            }`} 
                          />
                          <span className="truncate">{format(event.startTime, 'h:mm a')}</span>
                        </div>
                      </div>
                    ))}

                    {totalEvents > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{totalEvents - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-primary" />
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">AgoraCare</span>
          </div>
          {hasGoogleConnected && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Google</span>
            </div>
          )}
          {hasOutlookConnected && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-xs text-muted-foreground">Outlook</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
