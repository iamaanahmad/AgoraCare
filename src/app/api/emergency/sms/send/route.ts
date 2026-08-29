import { NextRequest, NextResponse } from 'next/server';

/**
 * Send SMS notification using Twilio
 * This endpoint keeps Twilio credentials secure on the server
 */
export async function POST(request: NextRequest) {
  try {
    const { to, message, from } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Validate Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = from || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio credentials not configured');
      // Return success in development to avoid blocking
      if (process.env.NODE_ENV === 'development') {
        console.log('SMS would be sent to:', to);
        console.log('Message:', message);
        return NextResponse.json({
          success: true,
          messageId: `mock_${Date.now()}`,
          message: 'SMS sent (development mode)',
        });
      }
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 500 }
      );
    }

    // Send SMS using Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', fromNumber);
    formData.append('Body', message);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send SMS');
    }

    return NextResponse.json({
      success: true,
      messageId: data.sid,
      status: data.status,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send SMS',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
