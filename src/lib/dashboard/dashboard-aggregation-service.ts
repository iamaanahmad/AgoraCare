'use client';

import { Firestore } from 'firebase/firestore';
import { getUserProfiles, UserProfile } from '@/firebase/firestore/users';
import { getActiveMedications, getProfileAdherenceRecords, Medication, AdherenceRecord } from '@/firebase/firestore/medications';
import { getUpcomingAppointments, Appointment } from '@/firebase/firestore/appointments';

// ============================================================================
// Type Definitions
// ============================================================================

export interface DashboardData {
  profiles: ProfileHealthSummary[];
  todaysMedications: MedicationScheduleItem[];
  upcomingAppointments: Appointment[];
  alerts: HealthAlert[];
  adherenceStats: AdherenceStatistics;
}

export interface ProfileHealthSummary {
  profile: UserProfile;
  medicationCount: number;
  adherenceRate: number;
  nextMedication?: MedicationScheduleItem;
  nextAppointment?: Appointment;
  recentAlerts: HealthAlert[];
}

export interface MedicationScheduleItem {
  medication: Medication;
  scheduledTime: Date;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  profileName: string;
  profileId: string;
}

export interface HealthAlert {
  id: string;
  profileId: string;
  profileName: string;
  type: 'missed-medication' | 'upcoming-appointment' | 'prescription-expiring' | 'emergency' | 'overdue-appointment';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  metadata?: Record<string, any>;
}

export interface AdherenceStatistics {
  overall: number;
  byProfile: Record<string, number>;
  byMedication: Record<string, number>;
  trend: 'improving' | 'stable' | 'declining';
  period: 'week' | 'month' | 'year';
}

// ============================================================================
// Dashboard Data Aggregation
// ============================================================================

/**
 * Aggregate dashboard data for all profiles
 */
export async function aggregateDashboardData(
  firestore: Firestore,
  userId: string
): Promise<DashboardData> {
  // Fetch all profiles for the user
  const profiles = await getUserProfiles(firestore, userId);

  if (profiles.length === 0) {
    return {
      profiles: [],
      todaysMedications: [],
      upcomingAppointments: [],
      alerts: [],
      adherenceStats: {
        overall: 0,
        byProfile: {},
        byMedication: {},
        trend: 'stable',
        period: 'week',
      },
    };
  }

  // Fetch data for each profile in parallel
  const profileDataPromises = profiles.map(profile =>
    aggregateProfileData(firestore, userId, profile)
  );

  const profileSummaries = await Promise.all(profileDataPromises);

  // Aggregate today's medications across all profiles
  const todaysMedications = profileSummaries
    .flatMap(summary => summary.todaysMedications)
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

  // Aggregate upcoming appointments across all profiles
  const upcomingAppointments = profileSummaries
    .flatMap(summary => summary.upcomingAppointments)
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  // Generate alerts
  const alerts = await generateAlerts(firestore, userId, profiles, profileSummaries);

  // Calculate adherence statistics
  const adherenceStats = await calculateAdherenceStatistics(
    firestore,
    userId,
    profiles,
    'week'
  );

  return {
    profiles: profileSummaries.map(summary => ({
      profile: summary.profile,
      medicationCount: summary.medicationCount,
      adherenceRate: summary.adherenceRate,
      nextMedication: summary.nextMedication,
      nextAppointment: summary.nextAppointment,
      recentAlerts: alerts.filter(alert => alert.profileId === summary.profile.id).slice(0, 3),
    })),
    todaysMedications,
    upcomingAppointments: upcomingAppointments.slice(0, 10),
    alerts,
    adherenceStats,
  };
}

/**
 * Aggregate data for a single profile
 */
interface ProfileAggregateData {
  profile: UserProfile;
  medicationCount: number;
  adherenceRate: number;
  nextMedication?: MedicationScheduleItem;
  nextAppointment?: Appointment;
  todaysMedications: MedicationScheduleItem[];
  upcomingAppointments: Appointment[];
}

async function aggregateProfileData(
  firestore: Firestore,
  userId: string,
  profile: UserProfile
): Promise<ProfileAggregateData> {
  // Fetch active medications
  const medications = await getActiveMedications(firestore, userId, profile.id);

  // Fetch upcoming appointments
  const appointments = await getUpcomingAppointments(firestore, userId, profile.id);

  // Calculate today's medication schedule
  const todaysMedications = generateTodaysMedicationSchedule(medications, profile);

  // Calculate adherence rate for the past week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const adherenceRecords = await getProfileAdherenceRecords(
    firestore,
    userId,
    profile.id,
    weekAgo,
    new Date()
  );

  const adherenceRate = calculateProfileAdherenceRate(adherenceRecords);

  // Find next medication
  const now = new Date();
  const nextMedication = todaysMedications.find(
    med => med.scheduledTime > now && med.status === 'pending'
  );

  // Find next appointment
  const nextAppointment = appointments[0]; // Already sorted by date ascending

  return {
    profile,
    medicationCount: medications.length,
    adherenceRate,
    nextMedication,
    nextAppointment,
    todaysMedications,
    upcomingAppointments: appointments,
  };
}

/**
 * Generate today's medication schedule for a profile
 */
function generateTodaysMedicationSchedule(
  medications: Medication[],
  profile: UserProfile
): MedicationScheduleItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const scheduleItems: MedicationScheduleItem[] = [];

  for (const medication of medications) {
    // Check if medication should be taken today
    if (!shouldTakeMedicationToday(medication, today)) {
      continue;
    }

    // Generate schedule items for each timing
    for (const timing of medication.timing) {
      const [hours, minutes] = timing.time.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      scheduleItems.push({
        medication,
        scheduledTime,
        status: 'pending', // Will be updated based on adherence records
        profileName: profile.name,
        profileId: profile.id,
      });
    }
  }

  return scheduleItems.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
}

/**
 * Check if medication should be taken today
 */
function shouldTakeMedicationToday(medication: Medication, date: Date): boolean {
  const { frequency } = medication;

  // Check if medication has started
  if (medication.startDate > date) {
    return false;
  }

  // Check if medication has ended
  if (medication.endDate && medication.endDate < date) {
    return false;
  }

  switch (frequency.type) {
    case 'daily':
      return true;

    case 'alternate': {
      const daysSinceStart = Math.floor(
        (date.getTime() - medication.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceStart % 2 === 0;
    }

    case 'weekly': {
      const dayOfWeek = date.getDay();
      return frequency.daysOfWeek?.includes(dayOfWeek) || false;
    }

    case 'as-needed':
      return false; // As-needed medications are not scheduled

    default:
      return false;
  }
}

/**
 * Calculate adherence rate from records
 */
function calculateProfileAdherenceRate(records: AdherenceRecord[]): number {
  if (records.length === 0) {
    return 100; // No records means perfect adherence (or no medications)
  }

  const takenCount = records.filter(record => record.status === 'taken').length;
  return Math.round((takenCount / records.length) * 100);
}

// ============================================================================
// Alert Generation
// ============================================================================

/**
 * Generate health alerts for all profiles
 */
async function generateAlerts(
  firestore: Firestore,
  userId: string,
  profiles: UserProfile[],
  profileSummaries: ProfileAggregateData[]
): Promise<HealthAlert[]> {
  const alerts: HealthAlert[] = [];
  const now = new Date();

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const summary = profileSummaries[i];

    // Check for missed medications (past scheduled time by more than 15 minutes)
    const missedMedications = summary.todaysMedications.filter(med => {
      const timeDiff = now.getTime() - med.scheduledTime.getTime();
      return timeDiff > 15 * 60 * 1000 && med.status === 'pending';
    });

    for (const missed of missedMedications) {
      alerts.push({
        id: `missed-med-${profile.id}-${missed.medication.id}-${missed.scheduledTime.getTime()}`,
        profileId: profile.id,
        profileName: profile.name,
        type: 'missed-medication',
        severity: 'warning',
        message: `${profile.name} missed ${missed.medication.name} at ${formatTime(missed.scheduledTime)}`,
        timestamp: missed.scheduledTime,
        acknowledged: false,
        metadata: {
          medicationId: missed.medication.id,
          medicationName: missed.medication.name,
          scheduledTime: missed.scheduledTime.toISOString(),
        },
      });
    }

    // Check for upcoming appointments (within 24 hours)
    const upcomingAppointments = summary.upcomingAppointments.filter(appt => {
      const timeDiff = appt.dateTime.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
    });

    for (const appt of upcomingAppointments) {
      const hoursUntil = Math.round((appt.dateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      alerts.push({
        id: `upcoming-appt-${profile.id}-${appt.id}`,
        profileId: profile.id,
        profileName: profile.name,
        type: 'upcoming-appointment',
        severity: 'info',
        message: `${profile.name} has an appointment with ${appt.doctorName} in ${hoursUntil} hours`,
        timestamp: appt.dateTime,
        acknowledged: false,
        metadata: {
          appointmentId: appt.id,
          doctorName: appt.doctorName,
          dateTime: appt.dateTime.toISOString(),
        },
      });
    }

    // Check for overdue appointments (past scheduled time)
    const overdueAppointments = summary.upcomingAppointments.filter(appt => {
      return appt.dateTime < now && appt.status === 'scheduled';
    });

    for (const appt of overdueAppointments) {
      alerts.push({
        id: `overdue-appt-${profile.id}-${appt.id}`,
        profileId: profile.id,
        profileName: profile.name,
        type: 'overdue-appointment',
        severity: 'critical',
        message: `${profile.name}'s appointment with ${appt.doctorName} was scheduled for ${formatDateTime(appt.dateTime)}`,
        timestamp: appt.dateTime,
        acknowledged: false,
        metadata: {
          appointmentId: appt.id,
          doctorName: appt.doctorName,
          dateTime: appt.dateTime.toISOString(),
        },
      });
    }

    // Check for low adherence rate
    if (summary.adherenceRate < 70 && summary.medicationCount > 0) {
      alerts.push({
        id: `low-adherence-${profile.id}`,
        profileId: profile.id,
        profileName: profile.name,
        type: 'missed-medication',
        severity: 'warning',
        message: `${profile.name}'s medication adherence is ${summary.adherenceRate}% this week`,
        timestamp: now,
        acknowledged: false,
        metadata: {
          adherenceRate: summary.adherenceRate,
        },
      });
    }
  }

  // Sort alerts by severity and timestamp
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}

// ============================================================================
// Adherence Statistics
// ============================================================================

/**
 * Calculate adherence statistics across all profiles
 */
async function calculateAdherenceStatistics(
  firestore: Firestore,
  userId: string,
  profiles: UserProfile[],
  period: 'week' | 'month' | 'year'
): Promise<AdherenceStatistics> {
  const startDate = getStartDateForPeriod(period);
  const endDate = new Date();

  const byProfile: Record<string, number> = {};
  const byMedication: Record<string, number> = {};
  let totalRecords = 0;
  let totalTaken = 0;

  for (const profile of profiles) {
    // Fetch adherence records for the period
    const records = await getProfileAdherenceRecords(
      firestore,
      userId,
      profile.id,
      startDate,
      endDate
    );

    // Calculate profile adherence
    const profileTaken = records.filter(r => r.status === 'taken').length;
    const profileRate = records.length > 0 ? (profileTaken / records.length) * 100 : 100;
    byProfile[profile.id] = Math.round(profileRate);

    totalRecords += records.length;
    totalTaken += profileTaken;

    // Calculate per-medication adherence
    const medicationRecords = new Map<string, { taken: number; total: number }>();
    for (const record of records) {
      const existing = medicationRecords.get(record.medicationId) || { taken: 0, total: 0 };
      existing.total++;
      if (record.status === 'taken') {
        existing.taken++;
      }
      medicationRecords.set(record.medicationId, existing);
    }

    for (const [medId, stats] of medicationRecords) {
      const rate = (stats.taken / stats.total) * 100;
      byMedication[medId] = Math.round(rate);
    }
  }

  const overall = totalRecords > 0 ? Math.round((totalTaken / totalRecords) * 100) : 100;

  // Calculate trend (compare with previous period)
  const trend = await calculateAdherenceTrend(firestore, userId, profiles, period, overall);

  return {
    overall,
    byProfile,
    byMedication,
    trend,
    period,
  };
}

/**
 * Calculate adherence trend
 */
async function calculateAdherenceTrend(
  firestore: Firestore,
  userId: string,
  profiles: UserProfile[],
  period: 'week' | 'month' | 'year',
  currentRate: number
): Promise<'improving' | 'stable' | 'declining'> {
  const previousStartDate = getPreviousStartDateForPeriod(period);
  const previousEndDate = getStartDateForPeriod(period);

  let previousTotal = 0;
  let previousTaken = 0;

  for (const profile of profiles) {
    const records = await getProfileAdherenceRecords(
      firestore,
      userId,
      profile.id,
      previousStartDate,
      previousEndDate
    );

    previousTotal += records.length;
    previousTaken += records.filter(r => r.status === 'taken').length;
  }

  if (previousTotal === 0) {
    return 'stable';
  }

  const previousRate = (previousTaken / previousTotal) * 100;
  const diff = currentRate - previousRate;

  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/**
 * Get start date for a period
 */
function getStartDateForPeriod(period: 'week' | 'month' | 'year'): Date {
  const date = new Date();
  switch (period) {
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - 1);
      break;
  }
  return date;
}

/**
 * Get previous period start date
 */
function getPreviousStartDateForPeriod(period: 'week' | 'month' | 'year'): Date {
  const date = new Date();
  switch (period) {
    case 'week':
      date.setDate(date.getDate() - 14);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 2);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - 2);
      break;
  }
  return date;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format time as HH:MM AM/PM
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date and time
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
