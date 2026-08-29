/**
 * Emergency Detection Service
 * Detects emergency keywords and triggers in voice/text input
 */

export interface EmergencyTrigger {
  detected: boolean;
  confidence: number;
  keyword: string;
  type: 'emergency' | 'call_doctor' | 'help' | 'urgent';
  timestamp: Date;
}

/**
 * Emergency keyword patterns with priority levels
 */
const EMERGENCY_PATTERNS = {
  critical: [
    /\b(emergency|911|help me|can't breathe|chest pain|heart attack|stroke)\b/i,
    /\b(call ambulance|need ambulance|medical emergency)\b/i,
    /\b(severe pain|extreme pain|unbearable pain)\b/i,
  ],
  high: [
    /\b(call (the |my )?doctor|need (a |the )?doctor|see doctor (now|immediately))\b/i,
    /\b(urgent|urgently need|need help (now|immediately))\b/i,
    /\b(something('s| is) wrong|not feeling (well|good)|feel (terrible|awful))\b/i,
  ],
  medium: [
    /\b(help|assistance|support)\b/i,
    /\b(contact (my )?family|call (my )?(son|daughter|spouse|family))\b/i,
    /\b(need someone|someone help)\b/i,
  ],
};

/**
 * Wake words for emergency activation
 */
const WAKE_WORDS = [
  'emergency',
  'help',
  'doctor',
  'urgent',
  '911',
];

/**
 * Detect emergency triggers in user input
 */
export function detectEmergency(input: string): EmergencyTrigger | null {
  const normalizedInput = input.trim().toLowerCase();

  // Check critical patterns first
  for (const pattern of EMERGENCY_PATTERNS.critical) {
    const match = normalizedInput.match(pattern);
    if (match) {
      return {
        detected: true,
        confidence: 1.0,
        keyword: match[0],
        type: 'emergency',
        timestamp: new Date(),
      };
    }
  }

  // Check high priority patterns
  for (const pattern of EMERGENCY_PATTERNS.high) {
    const match = normalizedInput.match(pattern);
    if (match) {
      const isCallDoctor = /call.*doctor/i.test(match[0]);
      return {
        detected: true,
        confidence: 0.9,
        keyword: match[0],
        type: isCallDoctor ? 'call_doctor' : 'urgent',
        timestamp: new Date(),
      };
    }
  }

  // Check medium priority patterns
  for (const pattern of EMERGENCY_PATTERNS.medium) {
    const match = normalizedInput.match(pattern);
    if (match) {
      return {
        detected: true,
        confidence: 0.7,
        keyword: match[0],
        type: 'help',
        timestamp: new Date(),
      };
    }
  }

  return null;
}

/**
 * Check if input contains wake word
 */
export function containsWakeWord(input: string): boolean {
  const normalizedInput = input.trim().toLowerCase();
  return WAKE_WORDS.some(word => normalizedInput.includes(word));
}

/**
 * Validate if emergency trigger should activate emergency mode
 * Requires minimum confidence threshold
 */
export function shouldActivateEmergency(trigger: EmergencyTrigger | null): boolean {
  if (!trigger) return false;
  
  // Critical emergencies always activate
  if (trigger.type === 'emergency') return true;
  
  // High confidence triggers activate
  if (trigger.confidence >= 0.8) return true;
  
  // Medium confidence requires explicit keywords
  if (trigger.confidence >= 0.7 && trigger.type === 'call_doctor') return true;
  
  return false;
}

/**
 * Get emergency action based on trigger type
 */
export function getEmergencyAction(trigger: EmergencyTrigger): {
  action: 'call_emergency' | 'call_doctor' | 'notify_contacts' | 'show_panel';
  message: string;
  priority: 'critical' | 'high' | 'medium';
} {
  switch (trigger.type) {
    case 'emergency':
      return {
        action: 'call_emergency',
        message: 'Emergency detected. Activating emergency services.',
        priority: 'critical',
      };
    case 'call_doctor':
      return {
        action: 'call_doctor',
        message: 'Calling your doctor now.',
        priority: 'high',
      };
    case 'urgent':
      return {
        action: 'notify_contacts',
        message: 'Notifying your emergency contacts.',
        priority: 'high',
      };
    case 'help':
      return {
        action: 'show_panel',
        message: 'Opening emergency assistance panel.',
        priority: 'medium',
      };
    default:
      return {
        action: 'show_panel',
        message: 'How can I help you?',
        priority: 'medium',
      };
  }
}

/**
 * Continuous monitoring for emergency keywords
 * Used for real-time voice transcription monitoring
 */
export class EmergencyMonitor {
  private detectionCallback?: (trigger: EmergencyTrigger) => void;
  private isActive: boolean = false;
  private recentTriggers: EmergencyTrigger[] = [];
  private readonly MAX_RECENT_TRIGGERS = 10;

  /**
   * Start monitoring for emergency keywords
   */
  start(callback: (trigger: EmergencyTrigger) => void): void {
    this.detectionCallback = callback;
    this.isActive = true;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isActive = false;
    this.detectionCallback = undefined;
  }

  /**
   * Process incoming text for emergency detection
   */
  process(text: string): void {
    if (!this.isActive || !this.detectionCallback) return;

    const trigger = detectEmergency(text);
    
    if (trigger && shouldActivateEmergency(trigger)) {
      // Store trigger in recent history
      this.recentTriggers.push(trigger);
      if (this.recentTriggers.length > this.MAX_RECENT_TRIGGERS) {
        this.recentTriggers.shift();
      }

      // Notify callback
      this.detectionCallback(trigger);
    }
  }

  /**
   * Get recent emergency triggers
   */
  getRecentTriggers(): EmergencyTrigger[] {
    return [...this.recentTriggers];
  }

  /**
   * Clear recent triggers
   */
  clearHistory(): void {
    this.recentTriggers = [];
  }

  /**
   * Check if currently monitoring
   */
  isMonitoring(): boolean {
    return this.isActive;
  }
}
