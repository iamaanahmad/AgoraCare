'use client';

import { useState, useMemo } from 'react';
import { Medication, AdherenceRecord } from '@/firebase/firestore/medications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTodaysScheduledDoses, ScheduledDose } from '@/lib/medication-scheduler';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';
import { Clock, Check, X, SkipForward, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MedicationSchedulerProps {
  medications: Medication[];
  adherenceRecords: AdherenceRecord[];
  onMarkTaken: (medicationId: string, scheduledTime: Date) => void;
  onMarkMissed: (medicationId: string, scheduledTime: Date) => void;
  onMarkSkipped: (medicationId: string, scheduledTime: Date) => void;
}

interface ScheduleItem extends ScheduledDose {
  medication: Medication;
  adherenceRecord?: AdherenceRecord;
  isPast: boolean;
  isUpcoming: boolean;
}

export function MedicationScheduler({
  medications,
  adherenceRecords,
  onMarkTaken,
  onMarkMissed,
  onMarkSkipped,
}: MedicationSchedulerProps) {
  const [selectedView, setSelectedView] = useState<'timeline' | 'list'>('timeline');
  const now = new Date();

  // Generate today's schedule
  const scheduleItems = useMemo(() => {
    const items: ScheduleItem[] = [];

    medications.forEach((medication) => {
      // Normalize frequency
      const frequency: MedicationFrequency = medication.frequency?.type
        ? medication.frequency
        : { type: 'daily' };

      // Normalize timing
      let timing: MedicationTiming[] = medication.timing && Array.isArray(medication.timing) && medication.timing.length > 0
        ? medication.timing
        : [];

      if (timing.length === 0 && (medication as any).nextDose) {
        const match = (medication as any).nextDose.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const meridian = match[3]?.toUpperCase();
          if (meridian === 'PM' && hours < 12) hours += 12;
          if (meridian === 'AM' && hours === 12) hours = 0;
          timing = [{ time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` }];
        }
      }

      if (timing.length === 0) {
        timing = [{ time: '08:00', relation: 'morning' }];
      }

      // Normalize startDate
      let startDate = new Date('2024-01-01');
      if (medication.startDate) {
        if (typeof (medication.startDate as any).toDate === 'function') {
          startDate = (medication.startDate as any).toDate();
        } else if (medication.startDate instanceof Date) {
          startDate = medication.startDate;
        } else {
          startDate = new Date(medication.startDate);
        }
      }

      const doses = getTodaysScheduledDoses(
        frequency,
        timing,
        startDate,
        now
      );

      doses.forEach((dose) => {
        const adherenceRecord = adherenceRecords.find(
          (record) => {
            const recordTime = record.scheduledTime instanceof Date
              ? record.scheduledTime.getTime()
              : typeof (record.scheduledTime as any)?.toDate === 'function'
              ? (record.scheduledTime as any).toDate().getTime()
              : new Date(record.scheduledTime).getTime();
            return record.medicationId === medication.id && Math.abs(recordTime - dose.date.getTime()) < 60000;
          }
        );

        const isPast = isBefore(dose.date, now);
        const isUpcoming = isAfter(dose.date, now) && isBefore(dose.date, addMinutes(now, 60));

        items.push({
          ...dose,
          medication,
          adherenceRecord,
          isPast,
          isUpcoming,
        });
      });
    });

    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [medications, adherenceRecords, now]);

  const upcomingItems = scheduleItems.filter((item) => !item.isPast && !item.adherenceRecord);
  const completedItems = scheduleItems.filter((item) => item.adherenceRecord?.status === 'taken');
  const missedItems = scheduleItems.filter(
    (item) => item.isPast && !item.adherenceRecord && item.medication.frequency?.type !== 'as-needed'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Medication Schedule</CardTitle>
        <CardDescription>
          {format(now, 'EEEE, MMMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {scheduleItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No medications scheduled for today
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                {/* Schedule items */}
                <div className="space-y-6">
                  {scheduleItems.map((item, index) => (
                    <TimelineItem
                      key={`${item.medication.id}-${item.date.getTime()}`}
                      item={item}
                      onMarkTaken={() => onMarkTaken(item.medication.id, item.date)}
                      onMarkMissed={() => onMarkMissed(item.medication.id, item.date)}
                      onMarkSkipped={() => onMarkSkipped(item.medication.id, item.date)}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            {/* Upcoming */}
            {upcomingItems.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming ({upcomingItems.length})
                </h3>
                <div className="space-y-2">
                  {upcomingItems.map((item) => (
                    <ListItem
                      key={`${item.medication.id}-${item.date.getTime()}`}
                      item={item}
                      onMarkTaken={() => onMarkTaken(item.medication.id, item.date)}
                      onMarkMissed={() => onMarkMissed(item.medication.id, item.date)}
                      onMarkSkipped={() => onMarkSkipped(item.medication.id, item.date)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedItems.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Completed ({completedItems.length})
                </h3>
                <div className="space-y-2">
                  {completedItems.map((item) => (
                    <ListItem
                      key={`${item.medication.id}-${item.date.getTime()}`}
                      item={item}
                      onMarkTaken={() => onMarkTaken(item.medication.id, item.date)}
                      onMarkMissed={() => onMarkMissed(item.medication.id, item.date)}
                      onMarkSkipped={() => onMarkSkipped(item.medication.id, item.date)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Missed */}
            {missedItems.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Missed ({missedItems.length})
                </h3>
                <div className="space-y-2">
                  {missedItems.map((item) => (
                    <ListItem
                      key={`${item.medication.id}-${item.date.getTime()}`}
                      item={item}
                      onMarkTaken={() => onMarkTaken(item.medication.id, item.date)}
                      onMarkMissed={() => onMarkMissed(item.medication.id, item.date)}
                      onMarkSkipped={() => onMarkSkipped(item.medication.id, item.date)}
                    />
                  ))}
                </div>
              </div>
            )}

            {scheduleItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No medications scheduled for today
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TimelineItem({
  item,
  onMarkTaken,
  onMarkMissed,
  onMarkSkipped,
}: {
  item: ScheduleItem;
  onMarkTaken: () => void;
  onMarkMissed: () => void;
  onMarkSkipped: () => void;
}) {
  const status = item.adherenceRecord?.status;
  const isPending = !status && !item.isPast;
  const isMissed = !status && item.isPast;

  return (
    <div className="relative pl-14">
      {/* Timeline dot */}
      <div
        className={`absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          status === 'taken'
            ? 'bg-green-500 border-green-500'
            : status === 'skipped'
            ? 'bg-yellow-500 border-yellow-500'
            : status === 'missed' || isMissed
            ? 'bg-red-500 border-red-500'
            : item.isUpcoming
            ? 'bg-primary border-primary animate-pulse'
            : 'bg-background border-border'
        }`}
      >
        {status === 'taken' && <Check className="h-3 w-3 text-white" />}
        {status === 'skipped' && <SkipForward className="h-3 w-3 text-white" />}
        {(status === 'missed' || isMissed) && <X className="h-3 w-3 text-white" />}
      </div>

      {/* Content */}
      <Card className={item.isUpcoming ? 'border-primary' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold">{item.medication.name}</p>
              <p className="text-sm text-muted-foreground">{item.medication.dosage}</p>
            </div>
            <Badge variant={isPending ? 'default' : 'secondary'}>
              {format(item.date, 'h:mm a')}
            </Badge>
          </div>

          {item.timing.relation && (
            <p className="text-sm text-muted-foreground mb-3 capitalize">
              {item.timing.relation.replace('-', ' ')}
            </p>
          )}

          {/* Status or Actions */}
          {status ? (
            <Badge
              variant={
                status === 'taken' ? 'default' : status === 'skipped' ? 'secondary' : 'destructive'
              }
            >
              {status === 'taken' && 'Taken'}
              {status === 'skipped' && 'Skipped'}
              {status === 'missed' && 'Missed'}
              {item.adherenceRecord?.actualTime &&
                ` at ${format(item.adherenceRecord.actualTime, 'h:mm a')}`}
            </Badge>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={onMarkTaken} className="flex-1">
                <Check className="h-4 w-4 mr-1" />
                Taken
              </Button>
              <Button size="sm" variant="outline" onClick={onMarkSkipped}>
                <SkipForward className="h-4 w-4" />
              </Button>
              {item.isPast && (
                <Button size="sm" variant="destructive" onClick={onMarkMissed}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ListItem({
  item,
  onMarkTaken,
  onMarkMissed,
  onMarkSkipped,
}: {
  item: ScheduleItem;
  onMarkTaken: () => void;
  onMarkMissed: () => void;
  onMarkSkipped: () => void;
}) {
  const status = item.adherenceRecord?.status;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold">{item.medication.name}</p>
              <Badge variant="outline">{format(item.date, 'h:mm a')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{item.medication.dosage}</p>
          </div>

          {!status && (
            <div className="flex gap-2">
              <Button size="sm" onClick={onMarkTaken}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={onMarkSkipped}>
                <SkipForward className="h-4 w-4" />
              </Button>
              {item.isPast && (
                <Button size="sm" variant="destructive" onClick={onMarkMissed}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
