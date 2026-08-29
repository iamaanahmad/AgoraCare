# Changelog

All notable changes to AgoraCare will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source documentation (CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md)
- MIT License
- Changelog

## [1.0.0] - 2025-11-16

### Added
- Voice-powered medication management with Agora Conversational AI SDK
- Conversational appointment booking with AI symptom analysis
- Intelligent prescription scanning with OCR and AI summarization
- Emergency assistance with voice triggers and instant notifications
- Multi-profile caregiver dashboard
- Real-time calendar synchronization (Google Calendar, Outlook)
- Firebase authentication (Google, Email, Phone)
- Medication adherence tracking and analytics
- Push notifications for medication reminders
- SMS notifications for emergencies
- Accessibility-first design (WCAG 2.1 AA compliant)
- Voice activity indicator and chat interface
- Emergency contact management
- Appointment reminder system
- Unified calendar view across family members
- Profile preferences and health information management

### Technical
- Next.js 15.3.3 with App Router
- React 18.3.1 with TypeScript 5
- Firebase 11.9.1 (Auth, Firestore, Storage, Messaging)
- Genkit AI 1.20.0 for AI orchestration
- TailwindCSS 3.4 with shadcn/ui components
- Agora SDK integration for voice and RTC
- Google Cloud Vision API for OCR
- Calendar API integrations (Google, Microsoft)

### Security
- End-to-end encryption for data in transit
- Encryption at rest via Firebase
- Role-based access control (RBAC)
- Secure OAuth token management
- Input validation and sanitization
- Audit logging for sensitive operations

## [0.1.0] - 2025-11-01

### Added
- Initial project setup
- Basic authentication flow
- Medication data models
- Appointment data models
- Firebase configuration
- UI component library setup

---

## Release Notes

### Version 1.0.0 - Initial Public Release

AgoraCare is now open source! This release includes all core features for voice-first healthcare management:

**For Patients:**
- Natural voice interaction for all major features
- Easy medication tracking with smart reminders
- Conversational appointment booking
- Quick prescription understanding via photo upload
- One-tap emergency assistance

**For Caregivers:**
- Centralized dashboard for managing family health
- Real-time adherence monitoring
- Unified calendar view
- Instant emergency notifications

**For Developers:**
- Clean, well-documented codebase
- Comprehensive API documentation
- Example implementations
- Testing infrastructure
- Contribution guidelines

We're excited to see what the community builds with AgoraCare!

---

[Unreleased]: https://github.com/yourusername/agoracare/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/agoracare/releases/tag/v1.0.0
[0.1.0]: https://github.com/yourusername/agoracare/releases/tag/v0.1.0
