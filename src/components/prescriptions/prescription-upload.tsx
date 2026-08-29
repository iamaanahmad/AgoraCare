'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStorage } from '@/firebase';
import { uploadFileWithProgress, validateFile, generateUserFilePath } from '@/firebase/storage';
import Image from 'next/image';

interface PrescriptionUploadProps {
  userId: string;
  profileId: string;
  onUploadComplete: (imageUrl: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
}

export function PrescriptionUpload({
  userId,
  profileId,
  onUploadComplete,
  onUploadError,
}: PrescriptionUploadProps) {
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // File validation constants
  const ALLOWED_TYPES = ['image/', 'application/pdf'];
  const MAX_SIZE_MB = 10;

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, ALLOWED_TYPES, MAX_SIZE_MB);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setUploadStatus('error');
      if (onUploadError) {
        onUploadError(validation.error || 'Invalid file');
      }
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, [onUploadError]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, ALLOWED_TYPES, MAX_SIZE_MB);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setUploadStatus('error');
      if (onUploadError) {
        onUploadError(validation.error || 'Invalid file');
      }
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, [onUploadError]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !storage) return;

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      setErrorMessage('');

      // Generate unique file path
      const filePath = generateUserFilePath(userId, 'prescriptions', selectedFile.name);

      // Upload with progress tracking
      const uploadTask = uploadFileWithProgress(
        storage,
        filePath,
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Wait for upload to complete
      const snapshot = await uploadTask;
      const { getDownloadURL } = await import('firebase/storage');
      const downloadURL = await getDownloadURL(snapshot.ref);

      setUploadStatus('success');
      setUploadProgress(100);
      
      // Notify parent component
      onUploadComplete(downloadURL, selectedFile.name);

      // Reset after a delay
      setTimeout(() => {
        handleClear();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload file';
      setErrorMessage(errorMsg);
      setUploadStatus('error');
      if (onUploadError) {
        onUploadError(errorMsg);
      }
    }
  }, [selectedFile, storage, userId, onUploadComplete, onUploadError]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Prescription</CardTitle>
        <CardDescription>
          Upload a photo or PDF of your prescription. Maximum file size: {MAX_SIZE_MB}MB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Area */}
        {!selectedFile && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={handleBrowseClick}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop your prescription here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports: Images (JPG, PNG) and PDF files
            </p>
          </div>
        )}

        {/* Preview Area */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="relative border rounded-lg p-4 bg-gray-50">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleClear}
                disabled={uploadStatus === 'uploading'}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-start gap-4">
                {previewUrl ? (
                  <div className="relative w-32 h-32 flex-shrink-0 rounded overflow-hidden border">
                    <Image
                      src={previewUrl}
                      alt="Prescription preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 flex-shrink-0 rounded border bg-white flex items-center justify-center">
                    <FileImage className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {selectedFile.type.split('/')[1] || 'Unknown type'}
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadStatus === 'uploading' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Success Message */}
            {uploadStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Prescription uploaded successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {uploadStatus === 'error' && errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading' || uploadStatus === 'success'}
                className="flex-1"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : uploadStatus === 'success' ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Uploaded
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Prescription
                  </>
                )}
              </Button>
              
              {uploadStatus !== 'uploading' && uploadStatus !== 'success' && (
                <Button variant="outline" onClick={handleClear}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}