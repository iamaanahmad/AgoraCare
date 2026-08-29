'use client';

import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  UploadTask,
  UploadMetadata
} from 'firebase/storage';
import { useStorage } from '@/firebase';

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  storage: ReturnType<typeof useStorage>,
  path: string,
  file: File | Blob,
  metadata?: UploadMetadata
): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Upload a file with progress tracking
 */
export function uploadFileWithProgress(
  storage: ReturnType<typeof useStorage>,
  path: string,
  file: File | Blob,
  onProgress?: (progress: number) => void,
  metadata?: UploadMetadata
): UploadTask {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  if (onProgress) {
    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    });
  }

  return uploadTask;
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(
  storage: ReturnType<typeof useStorage>,
  path: string
): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

/**
 * Get download URL for a file
 */
export async function getFileURL(
  storage: ReturnType<typeof useStorage>,
  path: string
): Promise<string> {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
}

/**
 * List all files in a directory
 */
export async function listFiles(
  storage: ReturnType<typeof useStorage>,
  path: string
): Promise<string[]> {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);
  const urls = await Promise.all(
    result.items.map(item => getDownloadURL(item))
  );
  return urls;
}

/**
 * Generate a unique file path for user uploads
 */
export function generateUserFilePath(
  userId: string,
  category: 'prescriptions' | 'avatars' | 'documents',
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/${category}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.some(type => file.type.startsWith(type))) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  return { valid: true };
}
