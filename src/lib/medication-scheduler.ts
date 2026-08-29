import { MedicationFrequency, MedicationTiming } from '@/firebase/firestore/medications';

// ============================================================================
// Natural Language Parsing
// ============================================================================

export interface ParsedSchedule {
  frequency: MedicationFrequency;
  timing: MedicationTiming[];
}

/**
 * Parse natural language timing instructions into structured schedule
 */
export function parseTimingInstructions(input: string): ParsedSchedule {
  const normalizedInput = input.toLowerCase().trim();

  // Parse frequency
  const frequency = parseFrequency(normalizedInput);
  
  // Parse timing
  const timing = parseTiming(normalizedInput);

  return { frequency, timing };
}

/**
 * Parse frequency from natural language
 */
function parseFrequency(input: string): MedicationFrequency {
  // As needed / PRN
  if (input.includes('as needed') || input.includes('prn') || input.includes('when needed')) {
    return { type: 'as-needed' };
  }

  // Alternate days / Every other day
  if (input.includes('alternate') || input.includes('every other day') || input.includes('every 2 days')) {
    return { type: 'alternate', interval: 2 };
  }

  // Weekly patterns
  if (input.includes('weekly') || input.includes('once a week')) {
    const daysOfWeek = extractDaysOfWeek(input);
    return { 
      type: 'weekly', 
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [0] // Default to Sunday
    };
  }

  // Specific days of week
  const daysOfWeek = extractDaysOfWeek(input);
  if (daysOfWeek.length > 0 && daysOfWeek.length < 7) {
    return { type: 'weekly', daysOfWeek };
  }

  // Default to daily
  return { type: 'daily' };
}

/**
 * Extract days of week from input
 */
function extractDaysOfWeek(input: string): number[] {
  const days: number[] = [];
  const dayMap: Record<string, number> = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2, 'tues': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
  };

  for (const [dayName, dayNum] of Object.entries(dayMap)) {
    if (input.includes(dayName)) {
      if (!days.includes(dayNum)) {
        days.push(dayNum);
      }
    }
  }

  return days.sort();
}

/**
 * Parse timing from natural language
 */
function parseTiming(input: string): MedicationTiming[] {
  const timings: MedicationTiming[] = [];

  // Check for specific times (e.g., "8am", "8:00", "20:00")
  const timeMatches = input.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/gi);
  if (timeMatches) {
    timeMatches.forEach(match => {
      const time = parseTimeString(match);
      if (time) {
        timings.push({ time });
      }
    });
  }

  // If no specific times found, parse frequency-based timing
  if (timings.length === 0) {
    timings.push(...parseFrequencyBasedTiming(input));
  }

  // Add meal relations if mentioned
  const relation = parseMealRelation(input);
  if (relation && timings.length > 0) {
    timings.forEach(timing => {
      timing.relation = relation;
    });
  }

  // If still no timings, default to morning
  if (timings.length === 0) {
    timings.push({ time: '08:00', relation: 'morning' });
  }

  return timings;
}

/**
 * Parse time string to HH:mm format
 */
function parseTimeString(timeStr: string): string | null {
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase();

  // Convert to 24-hour format
  if (meridiem === 'pm' && hours < 12) {
    hours += 12;
  } else if (meridiem === 'am' && hours === 12) {
    hours = 0;
  }

  // Validate
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse frequency-based timing (once daily, twice daily, etc.)
 */
function parseFrequencyBasedTiming(input: string): MedicationTiming[] {
  // Four times daily
  if (input.includes('four times') || input.includes('4 times') || input.includes('qid')) {
    return [
      { time: '08:00', relation: 'morning' },
      { time: '12:00', relation: 'afternoon' },
      { time: '17:00', relation: 'evening' },
      { time: '21:00', relation: 'bedtime' },
    ];
  }

  // Three times daily
  if (input.includes('three times') || input.includes('3 times') || input.includes('tid')) {
    return [
      { time: '08:00', relation: 'morning' },
      { time: '14:00', relation: 'afternoon' },
      { time: '20:00', relation: 'evening' },
    ];
  }

  // Twice daily
  if (input.includes('twice') || input.includes('two times') || input.includes('2 times') || input.includes('bid')) {
    return [
      { time: '08:00', relation: 'morning' },
      { time: '20:00', relation: 'evening' },
    ];
  }

  // Bedtime
  if (input.includes('bedtime') || input.includes('before bed') || input.includes('at night')) {
    return [{ time: '21:00', relation: 'bedtime' }];
  }

  // Evening
  if (input.includes('evening') || input.includes('dinner')) {
    return [{ time: '18:00', relation: 'evening' }];
  }

  // Afternoon
  if (input.includes('afternoon') || input.includes('lunch')) {
    return [{ time: '12:00', relation: 'afternoon' }];
  }

  // Morning / Once daily (default)
  return [{ time: '08:00', relation: 'morning' }];
}

/**
 * Parse meal relation from input
 */
function parseMealRelation(input: string): MedicationTiming['relation'] | undefined {
  if (input.includes('before meal') || input.includes('before eating')) {
    return 'before-meal';
  }
  if (input.includes('after meal') || input.includes('after eating')) {
    return 'after-meal';
  }
  if (input.includes('with meal') || input.includes('with food') || input.includes('while eating')) {
    return 'with-meal';
  }
  if (input.includes('bedtime') || input.includes('before bed')) {
    return 'bedtime';
  }
  return undefined;
}

// ============================================================================
// Schedule Generation
// ============================================================================

export interface ScheduledDose {
  date: Date;
  time: string;
  timing: MedicationTiming;
}

/**
 * Generate scheduled doses for a medication within a date range
 */
export function generateSchedule(
  frequency: MedicationFrequency,
  timing: MedicationTiming[],
  startDate: Date,
  endDate: Date
): ScheduledDose[] {
  const doses: ScheduledDose[] = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  const finalDate = new Date(endDate);
  finalDate.setHours(23, 59, 59, 999);

  while (currentDate <= finalDate) {
    if (shouldTakeMedicationOnDate(currentDate, frequency, startDate)) {
      timing.forEach(t => {
        const doseDate = new Date(currentDate);
        const [hours, minutes] = t.time.split(':').map(Number);
        doseDate.setHours(hours, minutes, 0, 0);

        doses.push({
          date: doseDate,
          time: t.time,
          timing: t,
        });
      });
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return doses.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Check if medication should be taken on a specific date
 */
function shouldTakeMedicationOnDate(
  date: Date,
  frequency: MedicationFrequency,
  startDate: Date
): boolean {
  switch (frequency.type) {
    case 'daily':
      return true;

    case 'alternate': {
      const daysSinceStart = Math.floor(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const interval = frequency.interval || 2;
      return daysSinceStart % interval === 0;
    }

    case 'weekly': {
      const dayOfWeek = date.getDay();
      return frequency.daysOfWeek?.includes(dayOfWeek) || false;
    }

    case 'as-needed':
      return false; // As-needed medications don't have scheduled doses

    default:
      return false;
  }
}

/**
 * Get next scheduled dose for a medication
 */
export function getNextScheduledDose(
  frequency: MedicationFrequency,
  timing: MedicationTiming[],
  startDate: Date,
  currentDate: Date = new Date()
): ScheduledDose | null {
  // For as-needed medications, there's no next scheduled dose
  if (frequency.type === 'as-needed') {
    return null;
  }

  // Generate schedule for next 30 days
  const endDate = new Date(currentDate);
  endDate.setDate(endDate.getDate() + 30);

  const schedule = generateSchedule(frequency, timing, startDate, endDate);

  // Find first dose after current time
  const nextDose = schedule.find(dose => dose.date > currentDate);

  return nextDose || null;
}

/**
 * Get today's scheduled doses for a medication
 */
export function getTodaysScheduledDoses(
  frequency: MedicationFrequency,
  timing: MedicationTiming[],
  startDate: Date,
  referenceDate: Date = new Date()
): ScheduledDose[] {
  const todayStart = new Date(referenceDate);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(referenceDate);
  todayEnd.setHours(23, 59, 59, 999);

  const schedule = generateSchedule(frequency, timing, startDate, todayEnd);

  return schedule.filter(dose => 
    dose.date >= todayStart && dose.date <= todayEnd
  );
}

/**
 * Format frequency for display
 */
export function formatFrequency(frequency: MedicationFrequency): string {
  switch (frequency.type) {
    case 'daily':
      return 'Daily';
    
    case 'alternate':
      return `Every ${frequency.interval || 2} days`;
    
    case 'weekly': {
      if (!frequency.daysOfWeek || frequency.daysOfWeek.length === 0) {
        return 'Weekly';
      }
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = frequency.daysOfWeek.map(d => dayNames[d]).join(', ');
      return `Weekly on ${days}`;
    }
    
    case 'as-needed':
      return 'As needed';
    
    default:
      return 'Unknown';
  }
}

/**
 * Format timing for display
 */
export function formatTiming(timing: MedicationTiming): string {
  const [hours, minutes] = timing.time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

  if (timing.relation) {
    const relationMap: Record<string, string> = {
      'before-meal': 'before meals',
      'after-meal': 'after meals',
      'with-meal': 'with meals',
      'bedtime': 'at bedtime',
      'morning': 'in the morning',
      'afternoon': 'in the afternoon',
      'evening': 'in the evening',
    };
    return `${timeStr} (${relationMap[timing.relation] || timing.relation})`;
  }

  return timeStr;
}

/**
 * Format schedule summary for display
 */
export function formatScheduleSummary(
  frequency: MedicationFrequency,
  timing: MedicationTiming[]
): string {
  const freqStr = formatFrequency(frequency);
  
  if (timing.length === 0) {
    return freqStr;
  }

  if (timing.length === 1) {
    return `${freqStr} at ${formatTiming(timing[0])}`;
  }

  const times = timing.map(t => formatTiming(t)).join(', ');
  return `${freqStr} at ${times}`;
}
