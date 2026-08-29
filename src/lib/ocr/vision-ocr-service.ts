'use server';

import { ImageAnnotatorClient } from '@google-cloud/vision';

// ============================================================================
// Type Definitions
// ============================================================================

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Configuration
// ============================================================================

const MIN_CONFIDENCE_THRESHOLD = 0.85; // 85% minimum accuracy requirement
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Initialize Google Cloud Vision client
 */
function getVisionClient(): ImageAnnotatorClient {
  // Check if credentials are available
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is not set');
  }

  // Initialize client with credentials
  // In production, use service account key file or Application Default Credentials
  const client = new ImageAnnotatorClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    // If using service account key file:
    // keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });

  return client;
}

// ============================================================================
// OCR Processing Functions
// ============================================================================

/**
 * Extract text from image URL using Google Cloud Vision OCR
 */
export async function extractTextFromImage(
  imageUrl: string
): Promise<OCRResult> {
  let lastError: Error | null = null;

  // Retry logic for failed OCR attempts
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await performOCR(imageUrl);
      
      // Check if confidence meets minimum threshold
      if (result.confidence < MIN_CONFIDENCE_THRESHOLD) {
        console.warn(
          `OCR confidence (${result.confidence.toFixed(2)}) below threshold (${MIN_CONFIDENCE_THRESHOLD})`
        );
        
        // If this is not the last attempt, retry
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown OCR error');
      console.error(`OCR attempt ${attempt} failed:`, lastError.message);

      // If this is not the last attempt, retry after delay
      if (attempt < MAX_RETRY_ATTEMPTS) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  // All attempts failed
  throw new Error(
    `OCR failed after ${MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Perform OCR on image using Google Cloud Vision API
 */
async function performOCR(imageUrl: string): Promise<OCRResult> {
  const client = getVisionClient();

  // Perform text detection
  const [result] = await client.textDetection(imageUrl);
  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    throw new Error('No text detected in image');
  }

  // First annotation contains the full text
  const fullTextAnnotation = detections[0];
  const fullText = fullTextAnnotation.description || '';

  // Calculate overall confidence from individual blocks
  const blocks: TextBlock[] = [];
  let totalConfidence = 0;
  let blockCount = 0;

  // Process individual text blocks (skip first one as it's the full text)
  for (let i = 1; i < detections.length; i++) {
    const detection = detections[i];
    const vertices = detection.boundingPoly?.vertices || [];

    if (vertices.length >= 4) {
      const x = vertices[0].x || 0;
      const y = vertices[0].y || 0;
      const width = (vertices[1].x || 0) - x;
      const height = (vertices[2].y || 0) - y;

      // Confidence is available in full text annotation
      const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence || 0.9;

      blocks.push({
        text: detection.description || '',
        confidence,
        boundingBox: { x, y, width, height },
      });

      totalConfidence += confidence;
      blockCount++;
    }
  }

  // Calculate average confidence
  const averageConfidence = blockCount > 0 ? totalConfidence / blockCount : 0.9;

  return {
    text: fullText,
    confidence: averageConfidence,
    blocks,
  };
}

/**
 * Extract text from base64 encoded image
 */
export async function extractTextFromBase64(
  base64Image: string
): Promise<OCRResult> {
  let lastError: Error | null = null;

  // Retry logic for failed OCR attempts
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const client = getVisionClient();

      // Remove data URL prefix if present
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

      // Perform text detection
      const [result] = await client.textDetection({
        image: { content: base64Data },
      });

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        throw new Error('No text detected in image');
      }

      // First annotation contains the full text
      const fullTextAnnotation = detections[0];
      const fullText = fullTextAnnotation.description || '';

      // Calculate overall confidence
      const blocks: TextBlock[] = [];
      let totalConfidence = 0;
      let blockCount = 0;

      // Process individual text blocks
      for (let i = 1; i < detections.length; i++) {
        const detection = detections[i];
        const vertices = detection.boundingPoly?.vertices || [];

        if (vertices.length >= 4) {
          const x = vertices[0].x || 0;
          const y = vertices[0].y || 0;
          const width = (vertices[1].x || 0) - x;
          const height = (vertices[2].y || 0) - y;

          const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence || 0.9;

          blocks.push({
            text: detection.description || '',
            confidence,
            boundingBox: { x, y, width, height },
          });

          totalConfidence += confidence;
          blockCount++;
        }
      }

      const averageConfidence = blockCount > 0 ? totalConfidence / blockCount : 0.9;

      const ocrResult = {
        text: fullText,
        confidence: averageConfidence,
        blocks,
      };

      // Check confidence threshold
      if (ocrResult.confidence < MIN_CONFIDENCE_THRESHOLD) {
        console.warn(
          `OCR confidence (${ocrResult.confidence.toFixed(2)}) below threshold (${MIN_CONFIDENCE_THRESHOLD})`
        );

        if (attempt < MAX_RETRY_ATTEMPTS) {
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }
      }

      return ocrResult;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown OCR error');
      console.error(`OCR attempt ${attempt} failed:`, lastError.message);

      if (attempt < MAX_RETRY_ATTEMPTS) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(
    `OCR failed after ${MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate OCR result quality
 */
export async function validateOCRResult(result: OCRResult): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check confidence threshold
  if (result.confidence < MIN_CONFIDENCE_THRESHOLD) {
    issues.push(
      `Low confidence score: ${(result.confidence * 100).toFixed(1)}% (minimum: ${(MIN_CONFIDENCE_THRESHOLD * 100).toFixed(1)}%)`
    );
  }

  // Check if text is empty
  if (!result.text || result.text.trim().length === 0) {
    issues.push('No text extracted from image');
  }

  // Check if text is too short (likely not a prescription)
  if (result.text.trim().length < 20) {
    issues.push('Extracted text is too short to be a valid prescription');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
