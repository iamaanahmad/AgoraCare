'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Plus,
  User,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { PrescriptionSummarizerOutput } from '@/ai/flows/prescription-summarizer';

interface MedicationWithStatus {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  timing?: string;
  addedToSchedule?: boolean;
}

interface PrescriptionSummaryProps {
  summary: Omit<PrescriptionSummarizerOutput, 'medications'> & {
    medications: MedicationWithStatus[];
  };
  ocrConfidence?: number;
  onAddToSchedule?: (medication: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }) => void;
  onViewOriginal?: () => void;
}

export function PrescriptionSummary({
  summary,
  ocrConfidence,
  onAddToSchedule,
  onViewOriginal,
}: PrescriptionSummaryProps) {
  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive',
    };
    return (
      <Badge variant={variants[confidence] || 'secondary'}>
        {confidence.toUpperCase()} CONFIDENCE
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Confidence */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Prescription Summary</CardTitle>
              <CardDescription>
                {summary.doctorName && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Dr. {summary.doctorName}
                  </span>
                )}
                {summary.prescriptionDate && (
                  <span className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {summary.prescriptionDate}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {getConfidenceBadge(summary.confidence)}
              {ocrConfidence && (
                <span className="text-xs text-gray-500">
                  OCR: {(ocrConfidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-base leading-relaxed">{summary.plainLanguageSummary}</p>
          </div>
          
          {onViewOriginal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewOriginal}
              className="mt-4"
            >
              <FileText className="mr-2 h-4 w-4" />
              View Original Prescription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Medications List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Medications</h3>
        {summary.medications.map((medication, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{medication.name}</CardTitle>
                    {medication.addedToSchedule && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Added
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-1">
                    {medication.dosage}
                  </CardDescription>
                </div>
                {onAddToSchedule && !medication.addedToSchedule && (
                  <Button
                    size="sm"
                    onClick={() => onAddToSchedule(medication)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Schedule
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Frequency</p>
                    <p className="text-sm text-gray-600">{medication.frequency}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-gray-600">{medication.duration}</p>
                  </div>
                </div>
              </div>

              {medication.instructions && (
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Instructions</p>
                    <p className="text-sm text-gray-600">{medication.instructions}</p>
                  </div>
                </div>
              )}

              {medication.timing && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Timing</p>
                    <p className="text-sm text-gray-600">{medication.timing}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warnings */}
      {summary.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Important Warnings</p>
            <ul className="list-disc list-inside space-y-1">
              {summary.warnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Drug Interactions */}
      {summary.interactions.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Potential Drug Interactions</p>
            <ul className="list-disc list-inside space-y-1">
              {summary.interactions.map((interaction, index) => (
                <li key={index} className="text-sm">
                  {interaction}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Special Instructions */}
      {summary.specialInstructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.specialInstructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{instruction}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Missing Information */}
      {summary.missingInformation && summary.missingInformation.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Missing Information</p>
            <p className="text-sm">
              The following information could not be extracted from the prescription:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {summary.missingInformation.map((info, index) => (
                <li key={index} className="text-sm">
                  {info}
                </li>
              ))}
            </ul>
            <p className="text-sm mt-2">
              Please consult your doctor or pharmacist for clarification.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
