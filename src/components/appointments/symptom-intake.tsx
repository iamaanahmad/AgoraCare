'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { symptomAnalyzer, type SymptomAnalyzerOutput } from '@/ai/flows/symptom-analyzer';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SymptomIntakeProps {
  patientName: string;
  patientAge?: number;
  patientAgeCategory?: 'child' | 'adult' | 'elder';
  existingConditions?: string[];
  onAnalysisComplete: (analysis: SymptomAnalyzerOutput) => void;
  onCancel?: () => void;
}

export function SymptomIntake({
  patientName,
  patientAge,
  patientAgeCategory,
  existingConditions,
  onAnalysisComplete,
  onCancel,
}: SymptomIntakeProps) {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SymptomAnalyzerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError('Please describe your symptoms');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await symptomAnalyzer({
        symptoms: symptoms.trim(),
        patientAge,
        patientAgeCategory,
        existingConditions,
      });

      setAnalysis(result);
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      setError('Failed to analyze symptoms. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    if (analysis) {
      onAnalysisComplete(analysis);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'destructive';
      case 'urgent':
        return 'default';
      case 'routine':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Tell us about your symptoms
          </CardTitle>
          <CardDescription>
            Describe what you're experiencing for {patientName}. Be as detailed as possible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Example: I've been having a persistent headache for 3 days, along with some dizziness and sensitivity to light..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={6}
              disabled={isAnalyzing || !!analysis}
              className="resize-none"
            />
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {!analysis && (
            <div className="flex gap-2">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !symptoms.trim()}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Symptoms'
                )}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isAnalyzing}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Severity and Urgency */}
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Severity</p>
                <Badge variant={getSeverityColor(analysis.severity)} className="text-sm">
                  {analysis.severity.toUpperCase()}
                </Badge>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Urgency</p>
                <Badge variant={getUrgencyColor(analysis.urgency)} className="text-sm">
                  {analysis.urgency.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Emergency Warning */}
            {analysis.urgency === 'emergency' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  These symptoms may require immediate medical attention. Consider calling emergency
                  services or visiting the nearest emergency room.
                </AlertDescription>
              </Alert>
            )}

            {/* Identified Symptoms */}
            <div>
              <p className="text-sm font-medium mb-2">Identified Symptoms</p>
              <div className="flex flex-wrap gap-2">
                {analysis.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommended Specializations */}
            <div>
              <p className="text-sm font-medium mb-2">Recommended Specialists</p>
              <div className="flex flex-wrap gap-2">
                {analysis.recommendedSpecializations.map((spec, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <p className="text-sm font-medium mb-2">Analysis</p>
              <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
            </div>

            {/* Additional Questions */}
            {analysis.additionalQuestions && analysis.additionalQuestions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Additional Information Needed</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {analysis.additionalQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleContinue} className="flex-1">
                Continue to Book Appointment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysis(null);
                  setSymptoms('');
                }}
              >
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
