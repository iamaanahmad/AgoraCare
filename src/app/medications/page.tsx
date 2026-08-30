'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, BarChart3 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useFamily } from '@/contexts/family-context';
import { useMedications } from '@/hooks/use-medications';
import { MedicationForm, MedicationFormData } from '@/components/medications/medication-form';
import { MedicationList } from '@/components/medications/medication-list';
import { MedicationScheduler } from '@/components/medications/medication-scheduler';
import { AdherenceStats } from '@/components/medications/adherence-stats';
import { Medication } from '@/firebase/firestore/medications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useMedicationReminders } from '@/hooks/use-medication-reminders';

export default function MedicationsPage() {
  const { user } = useUser();
  const { selectedMember } = useFamily();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    medications,
    adherenceRecords,
    isLoading,
    error,
    addMedication,
    editMedication,
    removeMedication,
    markAsTaken,
    markAsMissed,
    markAsSkipped,
  } = useMedications(user?.uid || '', selectedMember?.id || '');

  const { scheduleReminders, rescheduleReminders } = useMedicationReminders();


  const handleSubmit = async (data: MedicationFormData) => {
    setIsSubmitting(true);
    try {
      if (editingMedication) {
        await editMedication(editingMedication.id, data);
        
        // Reschedule reminders for updated medication
        const updatedMed = medications.find(m => m.id === editingMedication.id);
        if (updatedMed) {
          await rescheduleReminders(updatedMed);
        }
        
        toast({
          title: 'Medication updated',
          description: 'Your medication and reminders have been updated successfully.',
        });
      } else {
        const medicationId = await addMedication(data);
        
        // Schedule reminders for new medication
        const newMed = medications.find(m => m.id === medicationId);
        if (newMed) {
          const count = await scheduleReminders(newMed, 7);
          toast({
            title: 'Medication added',
            description: `Your medication has been added with ${count} reminders scheduled.`,
          });
        } else {
          toast({
            title: 'Medication added',
            description: 'Your medication has been added successfully.',
          });
        }
      }
      setShowForm(false);
      setEditingMedication(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingMedication) return;

    try {
      await removeMedication(deletingMedication.id);
      toast({
        title: 'Medication deleted',
        description: 'The medication has been removed.',
      });
      setDeletingMedication(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete medication',
        variant: 'destructive',
      });
    }
  };

  const handleMarkTaken = async (medication: Medication) => {
    try {
      await markAsTaken(medication.id, new Date());
      toast({
        title: 'Marked as taken',
        description: `${medication.name} has been marked as taken.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to mark as taken',
        variant: 'destructive',
      });
    }
  };

  if (!user || !selectedMember) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground">Please select a profile to view medications.</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8 w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Medications</h1>
            <p className="text-muted-foreground text-sm">
              Manage medications for {selectedMember.firstName}
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="self-start sm:self-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="schedule" className="space-y-6 w-full min-w-0">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto h-auto p-1">
            <TabsTrigger value="schedule" className="text-xs sm:text-sm py-2">
              <Calendar className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs sm:text-sm py-2">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              All Meds
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm py-2">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <MedicationScheduler
              medications={medications}
              adherenceRecords={adherenceRecords}
              onMarkTaken={markAsTaken}
              onMarkMissed={markAsMissed}
              onMarkSkipped={markAsSkipped}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <MedicationList
              medications={medications}
              onEdit={handleEdit}
              onDelete={setDeletingMedication}
              onMarkTaken={handleMarkTaken}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <AdherenceStats
              medications={medications}
              adherenceRecords={adherenceRecords}
              period="month"
            />
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingMedication(null);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMedication ? 'Edit Medication' : 'Add New Medication'}
              </DialogTitle>
            </DialogHeader>
            <MedicationForm
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingMedication(null);
              }}
              initialData={editingMedication || undefined}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingMedication} onOpenChange={(open) => !open && setDeletingMedication(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Medication</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deletingMedication?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
