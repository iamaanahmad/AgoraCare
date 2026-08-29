'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseTimingInstructions, formatScheduleSummary } from '@/lib/medication-scheduler';
import { Medication } from '@/firebase/firestore/medications';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface MedicationFormProps {
  onSubmit: (data: MedicationFormData) => void;
  onCancel: () => void;
  initialData?: Partial<Medication>;
  isLoading?: boolean;
}

export interface MedicationFormData {
  name: string;
  dosage: string;
  instructions: string;
  startDate: Date;
  endDate?: Date;
}

export function MedicationForm({ onSubmit, onCancel, initialData, isLoading }: MedicationFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [startDate, setStartDate] = useState<Date>(initialData?.startDate || new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(initialData?.endDate);
  const [parsedSchedule, setParsedSchedule] = useState<string>('');

  const handleInstructionsChange = (value: string) => {
    setInstructions(value);
    
    // Parse instructions in real-time
    if (value.trim()) {
      try {
        const parsed = parseTimingInstructions(value);
        const summary = formatScheduleSummary(parsed.frequency, parsed.timing);
        setParsedSchedule(summary);
      } catch (error) {
        setParsedSchedule('');
      }
    } else {
      setParsedSchedule('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      name,
      dosage,
      instructions,
      startDate,
      endDate,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Medication' : 'Add New Medication'}</CardTitle>
        <CardDescription>
          Use natural language to describe when to take this medication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medication Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Medication Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aspirin, Metformin"
              required
              disabled={isLoading}
            />
          </div>

          {/* Dosage */}
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 100mg, 2 tablets"
              required
              disabled={isLoading}
            />
          </div>

          {/* Instructions with conversational input */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Schedule Instructions *
            </Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              placeholder="e.g., twice daily after meals, every morning at 8am, alternate days"
              rows={3}
              required
              disabled={isLoading}
            />
            {parsedSchedule && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <strong>Understood:</strong> {parsedSchedule}
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date (Optional) */}
          <div className="space-y-2">
            <Label>End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'No end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => date < startDate}
                />
              </PopoverContent>
            </Popover>
            {endDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEndDate(undefined)}
                disabled={isLoading}
              >
                Clear end date
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : initialData ? 'Update Medication' : 'Add Medication'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
