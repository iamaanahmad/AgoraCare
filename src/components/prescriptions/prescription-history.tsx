'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  FileText,
  User,
  Eye,
  Trash2,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import type { Prescription } from '@/firebase/firestore/prescriptions';

interface PrescriptionHistoryProps {
  prescriptions: Prescription[];
  onViewDetails: (prescription: Prescription) => void;
  onDelete?: (prescriptionId: string) => void;
  isLoading?: boolean;
}

export function PrescriptionHistory({
  prescriptions,
  onViewDetails,
  onDelete,
  isLoading = false,
}: PrescriptionHistoryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  const getStatusBadge = (status: Prescription['processingStatus']) => {
    const variants: Record<
      Prescription['processingStatus'],
      { variant: 'default' | 'secondary' | 'destructive'; label: string; icon: React.ReactNode }
    > = {
      pending: { 
        variant: 'secondary', 
        label: 'Pending',
        icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      },
      processing: { 
        variant: 'secondary', 
        label: 'Processing',
        icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      },
      completed: { 
        variant: 'default', 
        label: 'Completed',
        icon: null
      },
      failed: { 
        variant: 'destructive', 
        label: 'Failed',
        icon: null
      },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600">No prescriptions yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload your first prescription to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {prescription.doctorName || 'Unknown Doctor'}
                      </CardTitle>
                      {getStatusBadge(prescription.processingStatus)}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(prescription.date, 'MMM dd, yyyy')}
                      </span>
                      {prescription.medications.length > 0 && (
                        <span>
                          {prescription.medications.length} medication
                          {prescription.medications.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Medications Preview */}
                  {prescription.medications.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Medications:</p>
                      <div className="flex flex-wrap gap-2">
                        {prescription.medications.slice(0, 3).map((med, index) => (
                          <Badge key={index} variant="outline">
                            {med.name}
                          </Badge>
                        ))}
                        {prescription.medications.length > 3 && (
                          <Badge variant="outline">
                            +{prescription.medications.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary Preview */}
                  {prescription.summary?.plainLanguage && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {prescription.summary.plainLanguage}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(prescription)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewImage(prescription.imageUrl)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Original
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(prescription.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Image Viewer Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Original Prescription</DialogTitle>
            <DialogDescription>
              View the original prescription image
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={selectedImage}
                alt="Prescription"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
