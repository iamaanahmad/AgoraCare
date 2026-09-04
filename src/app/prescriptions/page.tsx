'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PrescriptionUpload } from '@/components/prescriptions/prescription-upload';
import { PrescriptionSummary } from '@/components/prescriptions/prescription-summary';
import { PrescriptionHistory } from '@/components/prescriptions/prescription-history';
import { usePrescriptions } from '@/hooks/use-prescriptions';
import { useMedications } from '@/hooks/use-medications';
import { useUser } from '@/firebase';
import { useFamily } from '@/contexts/family-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle, FileText, Plus } from 'lucide-react';
import type { Prescription } from '@/firebase/firestore/prescriptions';
import type { PrescriptionSummarizerOutput } from '@/ai/flows/prescription-summarizer';

export default function PrescriptionsPage() {
  const { user } = useUser();
  const { selectedMember } = useFamily();
  const { toast } = useToast();
  const {
    prescriptions,
    isLoading: prescriptionsLoading,
    error: prescriptionsError,
    addPrescription,
    updatePrescriptionWithResults,
    markPrescriptionFailed,
    markMedicationAddedToSchedule,
    removePrescription,
  } = usePrescriptions();

  const medications = useMedications(
    user?.uid || '',
    selectedMember?.id || ''
  );

  const [processingPrescription, setProcessingPrescription] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // Handle prescription upload
  const handleUploadComplete = async (imageUrl: string, fileName: string) => {
    if (!user || !selectedMember) return;

    try {
      setUploadError(null);
      
      // Create prescription record
      const prescriptionId = await addPrescription(imageUrl);
      setProcessingPrescription(prescriptionId);

      // Process prescription with OCR and AI
      const response = await fetch('/api/prescriptions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          prescriptionId,
          userId: user.uid,
          profileId: selectedMember.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process prescription');
      }

      const result = await response.json();

      // Update prescription with results
      await updatePrescriptionWithResults(
        prescriptionId,
        result.ocrText,
        result.summary
      );

      setProcessingPrescription(null);
      
      // Show success message
      toast({
        title: 'Prescription processed',
        description: 'Your prescription has been analyzed successfully.',
      });
      
      // Switch to history tab to show results
      setActiveTab('history');
    } catch (error) {
      console.error('Error processing prescription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process prescription';
      setUploadError(errorMessage);
      
      toast({
        title: 'Processing failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      if (processingPrescription) {
        await markPrescriptionFailed(processingPrescription);
      }
      
      setProcessingPrescription(null);
    }
  };

  // Handle viewing prescription details
  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDetailsDialogOpen(true);
  };

  // Handle adding medication to schedule
  const handleAddToSchedule = async (
    prescriptionId: string,
    medication: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }
  ) => {
    try {
      // Parse duration to get end date
      const startDate = new Date();
      let endDate: Date | undefined;
      
      const durationMatch = medication.duration.match(/(\d+)\s*(day|week|month)/i);
      if (durationMatch) {
        const amount = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        
        endDate = new Date(startDate);
        if (unit === 'day') {
          endDate.setDate(endDate.getDate() + amount);
        } else if (unit === 'week') {
          endDate.setDate(endDate.getDate() + amount * 7);
        } else if (unit === 'month') {
          endDate.setMonth(endDate.getMonth() + amount);
        }
      }

      // Add medication to schedule
      await medications.addMedication({
        name: medication.name,
        dosage: medication.dosage,
        instructions: `${medication.frequency}. ${medication.instructions}`,
        startDate,
        endDate,
      });

      // Mark medication as added in prescription
      await markMedicationAddedToSchedule(prescriptionId, medication.name);
      
      // Update local state to immediately show the Added badge
      setSelectedPrescription(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          medications: prev.medications.map(m => 
            m.name === medication.name ? { ...m, addedToSchedule: true } : m
          )
        };
      });
      
      toast({
        title: 'Medication added',
        description: `${medication.name} has been added to your medication schedule.`,
      });
    } catch (error) {
      console.error('Error adding medication to schedule:', error);
      toast({
        title: 'Failed to add medication',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  // Handle deleting prescription
  const handleDeletePrescription = async (prescriptionId: string) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      try {
        await removePrescription(prescriptionId);
        toast({
          title: 'Prescription deleted',
          description: 'The prescription has been removed.',
        });
      } catch (error) {
        console.error('Error deleting prescription:', error);
        toast({
          title: 'Failed to delete',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      }
    }
  };

  if (!user || !selectedMember) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in and select a profile to manage prescriptions.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8 w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload and manage prescriptions with AI-powered explanations
          </p>
        </div>

        {/* Processing Status */}
        {processingPrescription && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Processing prescription... This may take a moment.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Error */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Prescriptions Error */}
        {prescriptionsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{prescriptionsError}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'history')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload New
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="mr-2 h-4 w-4" />
              History ({prescriptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <PrescriptionUpload
              userId={user.uid}
              profileId={selectedMember.id}
              onUploadComplete={handleUploadComplete}
              onUploadError={setUploadError}
            />

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Upload your prescription</p>
                    <p className="text-sm text-muted-foreground">
                      Take a clear photo or upload a PDF
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">AI analyzes the prescription</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI extracts medications and provides plain language explanations
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Add to your schedule</p>
                    <p className="text-sm text-muted-foreground">
                      Quickly add medications to your medication schedule with reminders
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <PrescriptionHistory
              prescriptions={prescriptions}
              onViewDetails={handleViewDetails}
              onDelete={handleDeletePrescription}
              isLoading={prescriptionsLoading}
            />
          </TabsContent>
        </Tabs>

        {/* Prescription Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
              <DialogDescription>
                AI-generated summary and medication information
              </DialogDescription>
            </DialogHeader>
            {selectedPrescription && (
              <>
                {selectedPrescription.processingStatus === 'completed' && (
                  <PrescriptionSummary
                    summary={{
                      plainLanguageSummary: selectedPrescription.summary.plainLanguage,
                      medications: selectedPrescription.medications.map((med) => ({
                        name: med.name,
                        dosage: med.dosage,
                        frequency: med.frequency,
                        duration: med.duration,
                        instructions: med.instructions,
                        addedToSchedule: med.addedToSchedule,
                      })),
                      warnings: selectedPrescription.summary.warnings,
                      interactions: selectedPrescription.summary.interactions,
                      specialInstructions: selectedPrescription.summary.specialInstructions,
                      doctorName: selectedPrescription.doctorName,
                      prescriptionDate: selectedPrescription.date.toLocaleDateString(),
                      confidence: 'high' as const,
                    }}
                    onAddToSchedule={(medication) =>
                      handleAddToSchedule(selectedPrescription.id, medication)
                    }
                    onViewOriginal={() => window.open(selectedPrescription.imageUrl, '_blank')}
                  />
                )}
                
                {selectedPrescription.processingStatus === 'processing' && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium">Processing prescription...</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a moment
                    </p>
                  </div>
                )}
                
                {selectedPrescription.processingStatus === 'failed' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to process this prescription. Please try uploading again.
                    </AlertDescription>
                  </Alert>
                )}
                
                {selectedPrescription.processingStatus === 'pending' && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Prescription is queued for processing...
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
