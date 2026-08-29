'use client';

import { useState } from 'react';
import { Plus, Phone, Mail, Trash2, Edit2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmergencyContact } from '@/firebase/firestore/users';
import { useEmergencyContacts } from '@/hooks/use-emergency-contacts';
import { EmergencyContactDialog } from './emergency-contact-dialog';

interface EmergencyContactManagerProps {
  userId: string;
  profileId: string;
}

export function EmergencyContactManager({ userId, profileId }: EmergencyContactManagerProps) {
  const { contacts, isLoading, addContact, updateContact, deleteContact } = useEmergencyContacts(
    userId,
    profileId
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const handleAddContact = () => {
    setEditingContact(null);
    setIsDialogOpen(true);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const handleSaveContact = async (contactData: Omit<EmergencyContact, 'id'>) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, contactData);
      } else {
        await addContact(contactData);
      }
      setIsDialogOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Error saving emergency contact:', error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Are you sure you want to delete this emergency contact?')) {
      try {
        await deleteContact(contactId);
      } catch (error) {
        console.error('Error deleting emergency contact:', error);
      }
    }
  };

  const getNotificationBadge = (preference: string) => {
    const badges = {
      call: <Badge variant="default">Call</Badge>,
      sms: <Badge variant="secondary">SMS</Badge>,
      both: <Badge variant="default">Call & SMS</Badge>,
    };
    return badges[preference as keyof typeof badges] || null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
          <CardDescription>Loading contacts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>
                Manage contacts who will be notified in case of emergency
              </CardDescription>
            </div>
            <Button onClick={handleAddContact} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No emergency contacts added yet.</p>
              <p className="text-sm mt-2">Add contacts who should be notified during emergencies.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <Card key={contact.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1 cursor-move">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{contact.name}</h4>
                            <Badge variant="outline">Priority {contact.priority}</Badge>
                            {getNotificationBadge(contact.notificationPreference)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{contact.relationship}</p>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{contact.phoneNumber}</span>
                            </div>
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{contact.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EmergencyContactDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contact={editingContact}
        onSave={handleSaveContact}
        existingPriorities={contacts.map((c) => c.priority)}
      />
    </>
  );
}
