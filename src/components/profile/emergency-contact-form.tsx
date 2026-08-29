'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmergencyContact } from '@/firebase/firestore/users';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EmergencyContactFormProps {
  contacts: EmergencyContact[];
  onAdd: (contact: Omit<EmergencyContact, 'id'>) => Promise<void>;
  onUpdate: (id: string, contact: Partial<EmergencyContact>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

interface ContactFormData {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  priority: number;
  notificationPreference: 'call' | 'sms' | 'both';
}

export function EmergencyContactForm({ contacts, onAdd, onUpdate, onDelete, isLoading }: EmergencyContactFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    defaultValues: {
      name: '',
      relationship: '',
      phoneNumber: '',
      email: '',
      priority: contacts.length + 1,
      notificationPreference: 'both',
    },
  });

  const notificationPreference = watch('notificationPreference');

  const handleAddContact = async (data: ContactFormData) => {
    await onAdd({
      name: data.name,
      relationship: data.relationship,
      phoneNumber: data.phoneNumber,
      email: data.email || undefined,
      priority: data.priority,
      notificationPreference: data.notificationPreference,
    });
    reset();
  };

  const handleDeleteContact = async (id: string) => {
    await onDelete(id);
  };

  return (
    <div className="space-y-6">
      {/* Existing Contacts List */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
            <CardDescription>
              People to notify in case of emergency (ordered by priority)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contacts
                .sort((a, b) => a.priority - b.priority)
                .map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {contact.priority}
                        </span>
                        <h4 className="font-semibold">{contact.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span>📞 {contact.phoneNumber}</span>
                        {contact.email && <span>✉️ {contact.email}</span>}
                        <span className="capitalize">
                          🔔 {contact.notificationPreference.replace('-', ' & ')}
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Emergency Contact</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {contact.name} from emergency contacts?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteContact(contact.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Emergency Contact</CardTitle>
          <CardDescription>
            Add someone to notify during health emergencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleAddContact)} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="contact-name">Full Name *</Label>
              <Input
                id="contact-name"
                {...register('name', { required: 'Name is required' })}
                placeholder="Enter contact name"
                className="text-base"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Relationship */}
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship *</Label>
              <Input
                id="relationship"
                {...register('relationship', { required: 'Relationship is required' })}
                placeholder="e.g., Spouse, Child, Doctor, Friend"
                className="text-base"
              />
              {errors.relationship && (
                <p className="text-sm text-destructive">{errors.relationship.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                {...register('phoneNumber', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                    message: 'Invalid phone number format',
                  },
                })}
                placeholder="+1 (555) 123-4567"
                className="text-base"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="contact@example.com"
                className="text-base"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Order *</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                {...register('priority', {
                  required: 'Priority is required',
                  min: { value: 1, message: 'Priority must be at least 1' },
                  valueAsNumber: true,
                })}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers are contacted first (1 = highest priority)
              </p>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority.message}</p>
              )}
            </div>

            {/* Notification Preference */}
            <div className="space-y-2">
              <Label htmlFor="notificationPreference">Notification Method *</Label>
              <Select
                value={notificationPreference}
                onValueChange={(value) =>
                  setValue('notificationPreference', value as 'call' | 'sms' | 'both')
                }
              >
                <SelectTrigger id="notificationPreference" className="text-base">
                  <SelectValue placeholder="Select notification method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call Only</SelectItem>
                  <SelectItem value="sms">SMS/Text Only</SelectItem>
                  <SelectItem value="both">Both Call & SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
              {(isSubmitting || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Emergency Contact
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
