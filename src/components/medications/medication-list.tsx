'use client';

import { Medication } from '@/firebase/firestore/medications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatScheduleSummary, getTodaysScheduledDoses } from '@/lib/medication-scheduler';
import { Pill, Clock, Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface MedicationListProps {
  medications: Medication[];
  onEdit?: (medication: Medication) => void;
  onDelete?: (medication: Medication) => void;
  onMarkTaken?: (medication: Medication) => void;
  adherenceData?: Record<string, { taken: number; total: number }>;
}

export function MedicationList({
  medications,
  onEdit,
  onDelete,
  onMarkTaken,
  adherenceData = {},
}: MedicationListProps) {
  // Deduplicate medications by name to prevent rendering duplicates
  const uniqueMedications = Array.from(
    medications.reduce((map, med) => {
      const key = (med.name || '').trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, med);
      }
      return map;
    }, new Map<string, Medication>()).values()
  );

  if (uniqueMedications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Pill className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No medications added yet.
            <br />
            Add your first medication to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {uniqueMedications.map((medication) => (
        <MedicationCard
          key={medication.id}
          medication={medication}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkTaken={onMarkTaken}
          adherenceRate={
            adherenceData[medication.id]
              ? (adherenceData[medication.id].taken / adherenceData[medication.id].total) * 100
              : undefined
          }
        />
      ))}
    </div>
  );
}

interface MedicationCardProps {
  medication: Medication;
  onEdit?: (medication: Medication) => void;
  onDelete?: (medication: Medication) => void;
  onMarkTaken?: (medication: Medication) => void;
  adherenceRate?: number;
}

function MedicationCard({
  medication,
  onEdit,
  onDelete,
  onMarkTaken,
  adherenceRate,
}: MedicationCardProps) {
  const schedule = formatScheduleSummary(medication.frequency, medication.timing);
  const todaysDoses = getTodaysScheduledDoses(
    medication.frequency,
    medication.timing,
    medication.startDate
  );

  const isActive = !medication.endDate || medication.endDate > new Date();
  const hasEndDate = !!medication.endDate;

  return (
    <Card className={!isActive ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl">{medication.name}</CardTitle>
              {!isActive && <Badge variant="secondary">Ended</Badge>}
              {medication.frequency.type === 'as-needed' && (
                <Badge variant="outline">As Needed</Badge>
              )}
            </div>
            <CardDescription className="text-base">{medication.dosage}</CardDescription>
          </div>
          
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(medication)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(medication)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Schedule */}
        <div className="flex items-start gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{schedule}</p>
            <p className="text-muted-foreground">{medication.instructions}</p>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Started {format(medication.startDate, 'MMM d, yyyy')}
            {hasEndDate && ` • Ends ${format(medication.endDate!, 'MMM d, yyyy')}`}
          </span>
        </div>

        {/* Adherence Rate */}
        {adherenceRate !== undefined && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">Adherence Rate</span>
            <Badge
              variant={adherenceRate >= 80 ? 'default' : adherenceRate >= 60 ? 'secondary' : 'destructive'}
            >
              {adherenceRate.toFixed(0)}%
            </Badge>
          </div>
        )}

        {/* Today's Doses */}
        {todaysDoses.length > 0 && isActive && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Today's Schedule</p>
            <div className="flex flex-wrap gap-2">
              {todaysDoses.map((dose, index) => (
                <Badge key={index} variant="outline">
                  {dose.time}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {isActive && onMarkTaken && medication.frequency.type !== 'as-needed' && (
          <Button
            onClick={() => onMarkTaken(medication)}
            className="w-full"
            size="lg"
          >
            Mark as Taken
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
