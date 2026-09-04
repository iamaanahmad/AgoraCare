'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Calendar, Clock, MapPin, User } from 'lucide-react';
import { type SymptomAnalyzerOutput } from '@/ai/flows/symptom-analyzer';
import { useAppointments } from '@/hooks/use-appointments';
import { normalizeSpecialization } from '@/lib/specialization-mapper';

interface AppointmentFormProps {
  userId: string;
  profileId: string;
  patientName: string;
  symptomAnalysis: SymptomAnalyzerOutput;
  onSuccess?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

const MOCK_DOCTORS: Record<string, string[]> = {
  'Cardiologist': ['Dr. Sarah Chen', 'Dr. Michael Roberts'],
  'Endocrinologist': ['Dr. James Wilson', 'Dr. Emily Wong'],
  'General Practitioner': ['Dr. Robert Smith', 'Dr. Lisa Johnson'],
  'Pediatrician': ['Dr. Amanda Garcia', 'Dr. David Lee'],
  'Neurologist': ['Dr. Richard Davis', 'Dr. Susan Martinez'],
  'Dermatologist': ['Dr. Jennifer Taylor', 'Dr. Kevin Brown'],
  'Psychiatrist': ['Dr. William Anderson', 'Dr. Patricia Thomas'],
};

const getDoctorsForSpecialization = (spec: string) => {
  return MOCK_DOCTORS[spec] || ['Dr. Auto Assigned'];
};

export function AppointmentForm({
  userId,
  profileId,
  patientName,
  symptomAnalysis,
  onSuccess,
  onBack,
  onCancel,
}: AppointmentFormProps) {
  const { addAppointment } = useAppointments(userId, profileId);

  const initialSpec = symptomAnalysis.recommendedSpecializations[0] || '';
  const initialDoctors = getDoctorsForSpecialization(initialSpec);

  const [formData, setFormData] = useState({
    doctorName: initialDoctors[0] || '',
    specialization: initialSpec,
    date: '',
    time: '',
    duration: '30',
    location: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.doctorName.trim()) {
      setError('Doctor name is required');
      return;
    }

    if (!formData.date || !formData.time) {
      setError('Date and time are required');
      return;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      if (dateTime < new Date()) {
        setError('Appointment date must be in the future');
        setIsSubmitting(false);
        return;
      }

      await addAppointment({
        doctorName: formData.doctorName.trim(),
        specialization: normalizeSpecialization(formData.specialization),
        dateTime,
        duration: parseInt(formData.duration),
        location: formData.location.trim(),
        symptoms: symptomAnalysis.symptoms,
        notes: formData.notes.trim() || undefined,
        remindersSent: [false, false],
        status: 'scheduled',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updates = { ...prev, [field]: value };
      if (field === 'specialization') {
        // Auto-update doctor name when specialization changes
        const doctors = getDoctorsForSpecialization(value);
        updates.doctorName = doctors[0] || 'Dr. Auto Assigned';
      }
      return updates;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Symptom Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Symptom Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {symptomAnalysis.symptoms.map((symptom, index) => (
              <Badge key={index} variant="outline">
                {symptom}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              Severity: {symptomAnalysis.severity.toUpperCase()}
            </Badge>
            <Badge variant="secondary">
              Urgency: {symptomAnalysis.urgency.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>Fill in the details for {patientName}'s appointment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Doctor Name */}
          <div className="space-y-2">
            <Label htmlFor="doctorName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Doctor Name
            </Label>
            <Select
              value={formData.doctorName}
              onValueChange={(value) => handleChange('doctorName', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="doctorName">
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
              <SelectContent>
                {getDoctorsForSpecialization(formData.specialization).map((doc) => (
                  <SelectItem key={doc} value={doc}>
                    {doc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Select
              value={formData.specialization}
              onValueChange={(value) => handleChange('specialization', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="specialization">
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent>
                {symptomAnalysis.recommendedSpecializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => handleChange('duration', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="123 Medical Center Dr, City, State"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Appointment...
            </>
          ) : (
            'Create Appointment'
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
