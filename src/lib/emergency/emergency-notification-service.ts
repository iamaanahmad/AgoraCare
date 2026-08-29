/**
 * Emergency Notification Service
 * Coordinates SMS and push notifications to emergency contacts
 */

import { EmergencyContact } from '@/firebase/firestore/users';
import { getSMSNotificationService, SMSResult } from './sms-notification-service';

export interface NotificationResult {
  contactId: string;
  contactName: string;
  sms?: SMSResult;
  push?: {
    success: boolean;
    error?: string;
  };
  timestamp: Date;
}

export interface EmergencyNotificationParams {
  patientName: string;
  profileId: string;
  emergencyType: 'call-doctor' | 'notify-family' | 'emergency-services';
  triggerKeyword?: string;
  location?: string;
  additionalInfo?: string;
}

export class EmergencyNotificationService {
  private smsService = getSMSNotificationService();

  /**
   * Notify all emergency contacts
   */
  async notifyAllContacts(
    contacts: EmergencyContact[],
    params: EmergencyNotificationParams
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Sort contacts by priority
    const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

    // Notify contacts in parallel
    const notificationPromises = sortedContacts.map(contact =>
      this.notifyContact(contact, params)
    );

    const notificationResults = await Promise.all(notificationPromises);
    results.push(...notificationResults);

    return results;
  }

  /**
   * Notify a single emergency contact
   */
  async notifyContact(
    contact: EmergencyContact,
    params: EmergencyNotificationParams
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      contactId: contact.id,
      contactName: contact.name,
      timestamp: new Date(),
    };

    // Send SMS if preference includes SMS
    if (['sms', 'both'].includes(contact.notificationPreference)) {
      const message = this.formatEmergencyMessage(contact, params);
      const formattedPhone = this.smsService.formatPhoneNumber(contact.phoneNumber);
      
      result.sms = await this.smsService.sendSMS({
        to: formattedPhone,
        message,
      });
    }

    // Send push notification if preference includes call/both
    if (['call', 'both'].includes(contact.notificationPreference) && contact.email) {
      result.push = await this.sendPushNotification(contact, params);
    }

    return result;
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    contact: EmergencyContact,
    params: EmergencyNotificationParams
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Call backend API to send push notification
      const response = await fetch('/api/emergency/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contact.email,
          title: '🚨 Emergency Alert',
          body: `${params.patientName} has triggered an emergency. Please check on them immediately.`,
          data: {
            profileId: params.profileId,
            emergencyType: params.emergencyType,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send push notification');
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format emergency message for SMS
   */
  private formatEmergencyMessage(
    contact: EmergencyContact,
    params: EmergencyNotificationParams
  ): string {
    let message = `🚨 EMERGENCY ALERT\n\n`;
    message += `Hi ${contact.name},\n\n`;
    message += `${params.patientName} has triggered an emergency alert.\n\n`;
    
    message += `Type: ${this.getEmergencyTypeLabel(params.emergencyType)}\n`;
    message += `Time: ${new Date().toLocaleString()}\n`;
    
    if (params.triggerKeyword) {
      message += `Trigger: "${params.triggerKeyword}"\n`;
    }
    
    if (params.location) {
      message += `Location: ${params.location}\n`;
    }
    
    if (params.additionalInfo) {
      message += `\n${params.additionalInfo}\n`;
    }
    
    message += `\nPlease check on them immediately or call emergency services if needed.`;
    message += `\n\n- AgoraCare Emergency System`;
    
    return message;
  }

  /**
   * Get human-readable emergency type label
   */
  private getEmergencyTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'call-doctor': 'Medical Assistance Needed',
      'notify-family': 'Family Notification',
      'emergency-services': 'Critical Emergency',
    };
    return labels[type] || type;
  }

  /**
   * Send follow-up notification
   */
  async sendFollowUp(
    contacts: EmergencyContact[],
    params: EmergencyNotificationParams & {
      status: 'resolved' | 'ongoing' | 'escalated';
      updateMessage: string;
    }
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const contact of contacts) {
      const message = this.formatFollowUpMessage(contact, params);
      const formattedPhone = this.smsService.formatPhoneNumber(contact.phoneNumber);

      const smsResult = await this.smsService.sendSMS({
        to: formattedPhone,
        message,
      });

      results.push({
        contactId: contact.id,
        contactName: contact.name,
        sms: smsResult,
        timestamp: new Date(),
      });
    }

    return results;
  }

  /**
   * Format follow-up message
   */
  private formatFollowUpMessage(
    contact: EmergencyContact,
    params: EmergencyNotificationParams & {
      status: 'resolved' | 'ongoing' | 'escalated';
      updateMessage: string;
    }
  ): string {
    let message = `📢 Emergency Update\n\n`;
    message += `Hi ${contact.name},\n\n`;
    message += `Update on ${params.patientName}'s emergency:\n\n`;
    message += `Status: ${params.status.toUpperCase()}\n`;
    message += `${params.updateMessage}\n`;
    message += `\nTime: ${new Date().toLocaleString()}`;
    message += `\n\n- AgoraCare Emergency System`;
    
    return message;
  }

  /**
   * Test notification delivery
   */
  async testNotification(contact: EmergencyContact): Promise<NotificationResult> {
    const testParams: EmergencyNotificationParams = {
      patientName: 'Test Patient',
      profileId: 'test',
      emergencyType: 'notify-family',
      additionalInfo: 'This is a test notification from AgoraCare.',
    };

    return this.notifyContact(contact, testParams);
  }
}

// Singleton instance
let notificationServiceInstance: EmergencyNotificationService | null = null;

/**
 * Get or create emergency notification service instance
 */
export function getEmergencyNotificationService(): EmergencyNotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new EmergencyNotificationService();
  }
  return notificationServiceInstance;
}
