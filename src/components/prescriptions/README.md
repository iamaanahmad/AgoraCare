# Prescription Components

This directory contains components for the prescription management feature, which allows users to upload prescriptions and get AI-powered explanations.

## Components

### PrescriptionUpload
Handles prescription image/PDF upload with drag-and-drop support and progress tracking.

**Features:**
- Drag and drop file upload
- File validation (images and PDFs up to 10MB)
- Upload progress indicator
- Preview for image files
- Success/error feedback

### PrescriptionSummary
Displays AI-generated prescription summary with medication details.

**Features:**
- Card-based layout for easy reading
- Confidence indicators for OCR and AI analysis
- Medication cards with detailed information:
  - Name, dosage, frequency, duration
  - Instructions and timing
  - "Add to Schedule" quick action button
  - Visual indicator when medication is added to schedule
- Warnings and drug interactions alerts
- Special instructions section
- Missing information alerts
- View original prescription button

### PrescriptionHistory
Shows list of all uploaded prescriptions with filtering and viewing options.

**Features:**
- Scrollable list of prescriptions
- Processing status indicators (pending, processing, completed, failed)
- Medication count preview
- Summary preview
- Quick actions:
  - View details
  - View original image
  - Delete prescription
- Image viewer dialog for original prescriptions

## Page Integration

The `/prescriptions` page integrates all components with:
- Tab-based navigation (Upload New / History)
- Real-time processing status
- Toast notifications for user feedback
- Medication schedule integration
- Error handling and loading states

## Workflow

1. **Upload**: User uploads prescription image/PDF
2. **Processing**: OCR extracts text, AI analyzes and generates summary
3. **Review**: User reviews AI-generated summary and medication details
4. **Add to Schedule**: User can quickly add medications to their schedule
5. **History**: All prescriptions are saved and accessible in history

## Requirements Covered

- **4.2**: Plain language prescription summaries
- **4.3**: Medication extraction with dosage, frequency, and instructions
- **4.4**: "Add to Schedule" quick action for medications
- **4.5**: Prescription history with original image access
- **Processing status indicators**: Visual feedback for upload and processing states
