'use client';

import { useState } from 'react';
import { SymptomIntake } from './symptom-intake';
import { AppointmentForm } from './appointment-form';
import { type SymptomAnalyzerOutput } from '@/ai/flows/symptom-analyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare } from 'lucide-react';

interface AppointmentBookingProps {
  userId: string;
  profileId: string;
  patientName: string;
  patientAge?: number;
  patientAgeCategory?: 'child' | 'adult' | 'elder';
  existingConditions?: string[];
  onComplete?: () => void;
  onCancel?: () => void;
}

type BookingStep = 'symptom-intake' | 'appointment-form';

export function AppointmentBooking({
  userId,
  profileId,
  patientName,
  patientAge,
  patientAgeCategory,
  existingConditions,
  onComplete,
  onCancel,
}: AppointmentBookingProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('symptom-intake');
  const [symptomAnalysis, setSymptomAnalysis] = useState<SymptomAnalyzerOutput | null>(null);

  const handleSymptomAnalysisComplete = (analysis: SymptomAnalyzerOutput) => {
    setSymptomAnalysis(analysis);
    setCurrentStep('appointment-form');
  };

  const handleAppointmentCreated = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleBack = () => {
    setCurrentStep('symptom-intake');
    setSymptomAnalysis(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'symptom-intake'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-green-600 text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Describe Symptoms</span>
            </div>

            <div className="h-px flex-1 bg-border mx-4" />

            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'appointment-form'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Book Appointment</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 'symptom-intake' && (
        <SymptomIntake
          patientName={patientName}
          patientAge={patientAge}
          patientAgeCategory={patientAgeCategory}
          existingConditions={existingConditions}
          onAnalysisComplete={handleSymptomAnalysisComplete}
          onCancel={onCancel}
        />
      )}

      {currentStep === 'appointment-form' && symptomAnalysis && (
        <AppointmentForm
          userId={userId}
          profileId={profileId}
          patientName={patientName}
          symptomAnalysis={symptomAnalysis}
          onSuccess={handleAppointmentCreated}
          onBack={handleBack}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}
