import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage, validateOCRResult } from '@/lib/ocr/vision-ocr-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Extract text from image using OCR
    const ocrResult = await extractTextFromImage(imageUrl);

    // Validate OCR result quality
    const validation = await validateOCRResult(ocrResult);

    return NextResponse.json({
      success: true,
      data: {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        blocks: ocrResult.blocks,
        validation: {
          valid: validation.valid,
          issues: validation.issues,
        },
      },
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process image',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
