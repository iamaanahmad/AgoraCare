'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useFamily } from '@/contexts/family-context';
import { useAppointments } from '@/hooks/use-appointments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppointmentBooking } from '@/components/appointments/appointment-booking';
import { AppointmentList } from '@/components/appointments/appointment-list';
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar';
import { UnifiedCalendarView } from '@/components/calendar/unified-calendar-view';
import { Plus, Calendar, List, Loader2, CalendarRange } from 'lucide-react';
import { Appointment } from '@/firebase/firestore/appointments';
import { CalendarEvent } from '@/lib/calendar/types';

export default function AppointmentsPage() {
  const { user } = useUser();
  const { selectedMember: activeProfile } = useFamily();
  const { appointments, loading, cancelAppointment, completeAppointment, refresh } =
    useAppointments(user?.uid, activeProfile?.id);

  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedExternalEvent, setSelectedExternalEvent] = useState<CalendarEvent | null>(null);

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'scheduled' && apt.dateTime > new Date()
  );

  const pastAppointments = appointments.filter(
    (apt) => apt.status !== 'scheduled' || apt.dateTime < new Date()
  );

  const handleBookingComplete = () => {
    setShowBookingDialog(false);
    refresh();
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelAppointment(appointmentId);
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await completeAppointment(appointmentId);
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    }
  };

  if (!user || !activeProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Please log in to view appointments</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            Manage appointments for {activeProfile.firstName} {activeProfile.lastName}
          </p>
        </div>
        <Button onClick={() => setShowBookingDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Past ({pastAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="unified" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Unified View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <AppointmentList
              appointments={upcomingAppointments}
              onViewDetails={setSelectedAppointment}
              onCancel={handleCancelAppointment}
              onComplete={handleCompleteAppointment}
            />
          </TabsContent>

          <TabsContent value="past">
            <AppointmentList
              appointments={pastAppointments}
              onViewDetails={setSelectedAppointment}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <AppointmentCalendar
              appointments={appointments}
              onAppointmentClick={setSelectedAppointment}
            />
          </TabsContent>

          <TabsContent value="unified">
            <UnifiedCalendarView
              appointments={appointments}
              userId={user.uid}
              profileId={activeProfile.id}
              onAppointmentClick={setSelectedAppointment}
              onExternalEventClick={setSelectedExternalEvent}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>
              Let's find the right doctor for {activeProfile.firstName} {activeProfile.lastName}
            </DialogDescription>
          </DialogHeader>
          <AppointmentBooking
            userId={user.uid}
            profileId={activeProfile.id}
            patientName={`${activeProfile.firstName} ${activeProfile.lastName}`}
            patientAgeCategory={activeProfile.role === 'Child' ? 'child' : activeProfile.role === 'Patient' ? 'elder' : 'adult'}
            onComplete={handleBookingComplete}
            onCancel={() => setShowBookingDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Doctor</p>
                <p className="text-sm text-muted-foreground">{selectedAppointment.doctorName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Specialization</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment.specialization}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment.dateTime.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment.duration} minutes
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{selectedAppointment.location}</p>
              </div>
              {selectedAppointment.symptoms && selectedAppointment.symptoms.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Symptoms</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.symptoms.join(', ')}
                  </p>
                </div>
              )}
              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* External Event Details Dialog */}
      <Dialog
        open={!!selectedExternalEvent}
        onOpenChange={(open) => !open && setSelectedExternalEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedExternalEvent?.provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} Event
            </DialogTitle>
          </DialogHeader>
          {selectedExternalEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Title</p>
                <p className="text-sm text-muted-foreground">{selectedExternalEvent.summary}</p>
              </div>
              {selectedExternalEvent.description && (
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedExternalEvent.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Start Time</p>
                <p className="text-sm text-muted-foreground">
                  {selectedExternalEvent.startTime.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">End Time</p>
                <p className="text-sm text-muted-foreground">
                  {selectedExternalEvent.endTime.toLocaleString()}
                </p>
              </div>
              {selectedExternalEvent.location && (
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{selectedExternalEvent.location}</p>
                </div>
              )}
              {selectedExternalEvent.attendees && selectedExternalEvent.attendees.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Attendees</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedExternalEvent.attendees.join(', ')}
                  </p>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  This event is synced from your {selectedExternalEvent.provider === 'google' ? 'Google' : 'Outlook'} calendar
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
