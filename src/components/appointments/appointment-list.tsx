'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Appointment } from '@/firebase/firestore/appointments';
import { format } from 'date-fns';

interface AppointmentListProps {
  appointments: Appointment[];
  onViewDetails?: (appointment: Appointment) => void;
  onCancel?: (appointmentId: string) => void;
  onComplete?: (appointmentId: string) => void;
  onEdit?: (appointment: Appointment) => void;
}

export function AppointmentList({
  appointments,
  onViewDetails,
  onCancel,
  onComplete,
  onEdit,
}: AppointmentListProps) {
  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="default">Scheduled</Badge>;
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      case 'no-show':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            No Show
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isUpcoming = (appointment: Appointment) => {
    return appointment.status === 'scheduled' && appointment.dateTime > new Date();
  };

  const isPast = (appointment: Appointment) => {
    return appointment.dateTime < new Date();
  };

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">No appointments found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card
          key={appointment.id}
          className={`${
            isUpcoming(appointment) ? 'border-primary' : ''
          } hover:shadow-md transition-shadow`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {appointment.doctorName}
                </CardTitle>
                <CardDescription>{appointment.specialization}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(appointment.status)}
                {appointment.status === 'scheduled' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewDetails && (
                        <DropdownMenuItem onClick={() => onViewDetails(appointment)}>
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(appointment)}>
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onComplete && !isPast(appointment) && (
                        <DropdownMenuItem onClick={() => onComplete(appointment.id)}>
                          Mark as Completed
                        </DropdownMenuItem>
                      )}
                      {onCancel && (
                        <DropdownMenuItem
                          onClick={() => onCancel(appointment.id)}
                          className="text-destructive"
                        >
                          Cancel Appointment
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(appointment.dateTime, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(appointment.dateTime, 'h:mm a')} ({appointment.duration} minutes)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.location}</span>
            </div>

            {appointment.symptoms && appointment.symptoms.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Symptoms:</p>
                <div className="flex flex-wrap gap-1">
                  {appointment.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {appointment.notes && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                <p className="text-sm">{appointment.notes}</p>
              </div>
            )}

            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(appointment)}
                className="w-full mt-2"
              >
                View Full Details
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
