'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFamily } from '@/contexts/family-context';
import { Pill, Calendar, AlertCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Medication, Appointment } from '@/lib/types';
import { format } from 'date-fns';

export function TodaysSchedule() {
  const { selectedMember } = useFamily();
  const firestore = useFirestore();

  const appointmentsRef = useMemoFirebase(
    () => collection(firestore, 'users', selectedMember.id, 'appointments'),
    [firestore, selectedMember.id]
  );
  const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsRef);

  const medicationsRef = useMemoFirebase(
    () => collection(firestore, 'users', selectedMember.id, 'medications'),
    [firestore, selectedMember.id]
  );
  const { data: medications, isLoading: medicationsLoading } = useCollection<Medication>(medicationsRef);

  const today = new Date();
  const todaysAppointments = appointments?.filter(
    (apt) => {
      const aptDate = apt.date.toDate();
      return aptDate.getDate() === today.getDate() &&
      aptDate.getMonth() === today.getMonth() &&
      aptDate.getFullYear() === today.getFullYear()
    }
  ) || [];

  const parseTimeString = (timeStr?: string) => {
    if (!timeStr || timeStr === 'As needed') return 999999;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 999999;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3]?.toUpperCase();
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Deduplicate items to prevent duplicate records from inflating the schedule
  const uniqueItemsMap = new Map<string, typeof rawScheduleItems[0]>();
  const rawScheduleItems = [
    ...todaysAppointments.map(item => ({ ...item, type: 'appointment' as const })),
    ...(medications || []).map(item => ({ ...item, type: 'medication' as const }))
  ];

  rawScheduleItems.forEach(item => {
    const key = item.type === 'medication' ? `med-${item.name}` : `apt-${item.title}-${item.time}`;
    if (!uniqueItemsMap.has(key)) {
      uniqueItemsMap.set(key, item);
    }
  });

  const scheduleItems = Array.from(uniqueItemsMap.values()).sort((a, b) => {
    const timeA = a.type === 'appointment' ? a.time : a.nextDose;
    const timeB = b.type === 'appointment' ? b.time : b.nextDose;
    return parseTimeString(timeA) - parseTimeString(timeB);
  });

  const isLoading = appointmentsLoading || medicationsLoading;


  return (
    <Card className="h-full glass-card border-none">
      <CardHeader>
        <CardTitle>Today's Schedule</CardTitle>
        <CardDescription>
          Upcoming medications and appointments for {selectedMember.firstName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading schedule...</p>
        ) : (
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {scheduleItems.length > 0 ? (
                  scheduleItems.map((item, itemIdx) => (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {itemIdx !== scheduleItems.length - 1 ? (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div>
                        <div className="relative px-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-8 ring-card">
                              {item.type === 'medication' ? (
                                  <Pill className="h-5 w-5 text-primary" />
                              ) : (
                                  <Calendar className="h-5 w-5 text-primary" />
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 py-1.5">
                        <div className="text-sm text-foreground">
                          <span className="font-medium">{item.type === 'medication' ? item.name : item.title}</span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <p>{item.type === 'medication' ? `${item.dosage} - ${item.schedule}` : `with ${item.doctor}`}</p>
                        </div>
                      </div>
                       <div className="flex-shrink-0 self-center text-right ml-4">
                          <p className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">{item.type === 'medication' ? item.nextDose : item.time}</p>
                          {item.type === 'appointment' && <p className="text-xs text-muted-foreground mt-1">{format(item.date.toDate(), 'MMM d')}</p>}
                       </div>
                    </div>
                  </div>
                </li>
              ))
              ) : (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                      <AlertCircle className="h-10 w-10 mb-2"/>
                      <p className="font-medium">No schedule items for {selectedMember.firstName} today.</p>
                  </div>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
