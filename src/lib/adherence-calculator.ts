import { AdherenceRecord, Medication } from '@/firebase/firestore/medications';
import { generateSchedule } from './medication-scheduler';
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';

// ============================================================================
// Adherence Statistics Types
// ============================================================================

export interface AdherenceStatistics {
  overall: number;
  byMedication: Record<string, MedicationAdherence>;
  byPeriod: PeriodAdherence;
  trend: 'improving' | 'stable' | 'declining';
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  totalSkipped: number;
}

export interface MedicationAdherence {
  medicationId: string;
  medicationName: string;
  rate: number;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
}

export interface PeriodAdherence {
  today: number;
  week: number;
  month: number;
}

export interface AdherenceTrend {
  date: Date;
  rate: number;
  taken: number;
  scheduled: number;
}

// ============================================================================
// Adherence Calculation Functions
// ============================================================================

/**
 * Calculate comprehensive adherence statistics
 */
export function calculateAdherenceStatistics(
  medications: Medication[],
  adherenceRecords: AdherenceRecord[],
  startDate: Date,
  endDate: Date
): AdherenceStatistics {
  // Calculate total scheduled doses
  let totalScheduled = 0;
  const byMedication: Record<string, MedicationAdherence> = {};

  medications.forEach((medication) => {
    const schedule = generateSchedule(
      medication.frequency,
      medication.timing,
      medication.startDate > startDate ? medication.startDate : startDate,
      medication.endDate && medication.endDate < endDate ? medication.endDate : endDate
    );

    const medicationRecords = adherenceRecords.filter(
      (record) => record.medicationId === medication.id
    );

    const taken = medicationRecords.filter((r) => r.status === 'taken').length;
    const missed = medicationRecords.filter((r) => r.status === 'missed').length;
    const skipped = medicationRecords.filter((r) => r.status === 'skipped').length;
    const scheduled = schedule.length;

    totalScheduled += scheduled;

    byMedication[medication.id] = {
      medicationId: medication.id,
      medicationName: medication.name,
      rate: scheduled > 0 ? (taken / scheduled) * 100 : 0,
      scheduled,
      taken,
      missed,
      skipped,
    };
  });

  // Calculate totals
  const totalTaken = adherenceRecords.filter((r) => r.status === 'taken').length;
  const totalMissed = adherenceRecords.filter((r) => r.status === 'missed').length;
  const totalSkipped = adherenceRecords.filter((r) => r.status === 'skipped').length;

  const overall = totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 0;

  // Calculate period adherence
  const now = new Date();
  const byPeriod: PeriodAdherence = {
    today: calculatePeriodAdherence(
      medications,
      adherenceRecords,
      startOfDay(now),
      endOfDay(now)
    ),
    week: calculatePeriodAdherence(
      medications,
      adherenceRecords,
      startOfWeek(now),
      endOfDay(now)
    ),
    month: calculatePeriodAdherence(
      medications,
      adherenceRecords,
      startOfMonth(now),
      endOfDay(now)
    ),
  };

  // Calculate trend
  const trend = calculateTrend(medications, adherenceRecords, now);

  return {
    overall,
    byMedication,
    byPeriod,
    trend,
    totalScheduled,
    totalTaken,
    totalMissed,
    totalSkipped,
  };
}

/**
 * Calculate adherence rate for a specific period
 */
function calculatePeriodAdherence(
  medications: Medication[],
  adherenceRecords: AdherenceRecord[],
  startDate: Date,
  endDate: Date
): number {
  let totalScheduled = 0;
  let totalTaken = 0;

  medications.forEach((medication) => {
    const schedule = generateSchedule(
      medication.frequency,
      medication.timing,
      medication.startDate > startDate ? medication.startDate : startDate,
      medication.endDate && medication.endDate < endDate ? medication.endDate : endDate
    );

    const taken = adherenceRecords.filter(
      (record) =>
        record.medicationId === medication.id &&
        record.status === 'taken' &&
        record.scheduledTime >= startDate &&
        record.scheduledTime <= endDate
    ).length;

    totalScheduled += schedule.length;
    totalTaken += taken;
  });

  return totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 0;
}

/**
 * Calculate adherence trend (improving, stable, or declining)
 */
function calculateTrend(
  medications: Medication[],
  adherenceRecords: AdherenceRecord[],
  referenceDate: Date
): 'improving' | 'stable' | 'declining' {
  const now = referenceDate;
  const last7Days = calculatePeriodAdherence(
    medications,
    adherenceRecords,
    subDays(now, 7),
    now
  );
  const previous7Days = calculatePeriodAdherence(
    medications,
    adherenceRecords,
    subDays(now, 14),
    subDays(now, 7)
  );

  const difference = last7Days - previous7Days;

  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

/**
 * Calculate daily adherence trend for visualization
 */
export function calculateDailyTrend(
  medications: Medication[],
  adherenceRecords: AdherenceRecord[],
  days: number = 30
): AdherenceTrend[] {
  const trends: AdherenceTrend[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    let scheduled = 0;
    let taken = 0;

    medications.forEach((medication) => {
      const schedule = generateSchedule(
        medication.frequency,
        medication.timing,
        medication.startDate > dayStart ? medication.startDate : dayStart,
        medication.endDate && medication.endDate < dayEnd ? medication.endDate : dayEnd
      );

      const dayTaken = adherenceRecords.filter(
        (record) =>
          record.medicationId === medication.id &&
          record.status === 'taken' &&
          record.scheduledTime >= dayStart &&
          record.scheduledTime <= dayEnd
      ).length;

      scheduled += schedule.length;
      taken += dayTaken;
    });

    trends.push({
      date: dayStart,
      rate: scheduled > 0 ? (taken / scheduled) * 100 : 0,
      taken,
      scheduled,
    });
  }

  return trends;
}

/**
 * Get adherence status for a specific medication at a specific time
 */
export function getAdherenceStatus(
  medicationId: string,
  scheduledTime: Date,
  adherenceRecords: AdherenceRecord[]
): 'taken' | 'missed' | 'skipped' | 'pending' {
  const record = adherenceRecords.find(
    (r) =>
      r.medicationId === medicationId &&
      Math.abs(r.scheduledTime.getTime() - scheduledTime.getTime()) < 60000 // Within 1 minute
  );

  if (record) {
    return record.status;
  }

  // If no record and time has passed, it's pending (not yet marked)
  return 'pending';
}

/**
 * Calculate streak (consecutive days with 100% adherence)
 */
export function calculateStreak(
  medications: Medication[],
  adherenceRecords: AdherenceRecord[]
): number {
  const now = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = subDays(now, i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const rate = calculatePeriodAdherence(medications, adherenceRecords, dayStart, dayEnd);

    if (rate === 100) {
      streak++;
    } else if (i > 0) {
      // Only break streak if it's not today (today might not be complete)
      break;
    }
  }

  return streak;
}

/**
 * Get missed doses that need attention
 */
export function getMissedDoses(
  medications: Medication[],
  adherenceRecords: AdherenceRecord[],
  hoursBack: number = 24
): Array<{ medication: Medication; scheduledTime: Date }> {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
  const missedDoses: Array<{ medication: Medication; scheduledTime: Date }> = [];

  medications.forEach((medication) => {
    const schedule = generateSchedule(
      medication.frequency,
      medication.timing,
      medication.startDate > cutoffTime ? medication.startDate : cutoffTime,
      now
    );

    schedule.forEach((dose) => {
      if (dose.date < now) {
        const status = getAdherenceStatus(medication.id, dose.date, adherenceRecords);
        if (status === 'pending') {
          missedDoses.push({
            medication,
            scheduledTime: dose.date,
          });
        }
      }
    });
  });

  return missedDoses.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
}

/**
 * Format adherence rate for display
 */
export function formatAdherenceRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/**
 * Get adherence rating (excellent, good, fair, poor)
 */
export function getAdherenceRating(rate: number): {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  description: string;
} {
  if (rate >= 90) {
    return {
      rating: 'excellent',
      color: 'text-green-600',
      description: 'Excellent adherence! Keep up the great work.',
    };
  } else if (rate >= 75) {
    return {
      rating: 'good',
      color: 'text-blue-600',
      description: 'Good adherence. Try to maintain consistency.',
    };
  } else if (rate >= 50) {
    return {
      rating: 'fair',
      color: 'text-yellow-600',
      description: 'Fair adherence. Consider setting more reminders.',
    };
  } else {
    return {
      rating: 'poor',
      color: 'text-red-600',
      description: 'Adherence needs improvement. Talk to your doctor.',
    };
  }
}

/**
 * Get the next scheduled dose across all medications
 */
export function getNextScheduledDose(
  medications: Medication[]
): { medication: Medication; scheduledTime: Date } | null {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  let nextDose: { medication: Medication; scheduledTime: Date } | null = null;
  let earliestTime: number = Infinity;

  medications.forEach((medication) => {
    const schedule = generateSchedule(
      medication.frequency,
      medication.timing,
      now,
      next24Hours
    );

    schedule.forEach((dose) => {
      if (dose.date >= now && dose.date.getTime() < earliestTime) {
        earliestTime = dose.date.getTime();
        nextDose = {
          medication,
          scheduledTime: dose.date,
        };
      }
    });
  });

  return nextDose;
}
