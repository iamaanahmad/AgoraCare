import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage, validateOCRResult } from '@/lib/ocr/vision-ocr-service';
import { prescriptionSummarizer } from '@/ai/flows/prescription-summarizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, patientAge, patientAgeCategory, existingMedications } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Step 1: Extract text from image using OCR
    console.log('Starting OCR processing for:', imageUrl);
    const ocrResult = await extractTextFromImage(imageUrl);

    // Validate OCR result quality
    const validation = await validateOCRResult(ocrResult);
    
    if (!validation.valid) {
      console.warn('OCR validation issues:', validation.issues);
    }

    // Step 2: Analyze prescription text with AI
    console.log('Starting AI prescription analysis...');
    const summary = await prescriptionSummarizer({
      ocrText: ocrResult.text,
      patientAge,
      patientAgeCategory,
      existingMedications,
    });

    // Step 3: Return combined results
    return NextResponse.json({
      ocrText: ocrResult.text,
      ocrConfidence: ocrResult.confidence,
      ocrValidation: validation,
      summary: summary,
    });
  } catch (error) {
    console.error('Prescription processing error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process prescription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
