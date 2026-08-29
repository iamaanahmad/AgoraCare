/**
 * SMS Notification Service
 * Sends SMS notifications to emergency contacts using Twilio
 */

export interface SMSNotification {
  to: string;
  message: string;
  from?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export class SMSNotificationService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  /**
   * Send SMS notification
   */
  async sendSMS(notification: SMSNotification): Promise<SMSResult> {
    try {
      // Validate configuration
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        throw new Error('Twilio credentials not configured');
      }

      // Call backend API to send SMS (to keep credentials secure)
      const response = await fetch('/api/emergency/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: notification.to,
          message: notification.message,
          from: notification.from || this.fromNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      return {
        success: true,
        messageId: data.messageId,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSMS(notifications: SMSNotification[]): Promise<SMSResult[]> {
    const results = await Promise.all(
      notifications.map(notification => this.sendSMS(notification))
    );
    return results;
  }

  /**
   * Format emergency message
   */
  formatEmergencyMessage(params: {
    patientName: string;
    emergencyType: string;
    timestamp: Date;
    location?: string;
  }): string {
    const { patientName, emergencyType, timestamp, location } = params;
    
    let message = `🚨 EMERGENCY ALERT\n\n`;
    message += `${patientName} has triggered an emergency.\n`;
    message += `Type: ${emergencyType}\n`;
    message += `Time: ${timestamp.toLocaleString()}\n`;
    
    if (location) {
      message += `Location: ${location}\n`;
    }
    
    message += `\nPlease check on them immediately.`;
    
    return message;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation for E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add + prefix if not present
    if (!phoneNumber.startsWith('+')) {
      // Assume US number if 10 digits
      if (cleaned.length === 10) {
        cleaned = '1' + cleaned;
      }
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
}

// Singleton instance
let smsServiceInstance: SMSNotificationService | null = null;

/**
 * Get or create SMS notification service instance
 */
export function getSMSNotificationService(): SMSNotificationService {
  if (!smsServiceInstance) {
    smsServiceInstance = new SMSNotificationService();
  }
  return smsServiceInstance;
}
