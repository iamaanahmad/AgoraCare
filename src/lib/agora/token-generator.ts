/**
 * Agora Token Generator
 * Server-side utility for generating RTC tokens
 * Note: This is a simplified version. In production, use Agora's official token server
 */

export interface TokenGenerationOptions {
  appId: string;
  appCertificate: string;
  channelName: string;
  uid: string | number;
  role: 'publisher' | 'subscriber';
  expirationTimeInSeconds?: number;
}

/**
 * Generate an Agora RTC token
 * This is a placeholder - in production, you should use Agora's official token generation library
 * or call your backend API that generates tokens securely
 */
export async function generateAgoraToken(
  options: TokenGenerationOptions
): Promise<string> {
  const {
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    expirationTimeInSeconds = 3600
  } = options;

  // In development, we can use a null token if app certificate is not set
  if (!appCertificate || appCertificate === 'your_agora_certificate') {
    console.warn('Using null token for Agora - this is only for development!');
    return '';
  }

  // For production, call your backend API endpoint
  try {
    const response = await fetch('/api/agora/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelName,
        uid,
        role,
        expirationTimeInSeconds,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate Agora token');
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error generating Agora token:', error);
    throw error;
  }
}

/**
 * Validate if a token is still valid
 */
export function isTokenValid(token: string, expirationTime: number): boolean {
  if (!token) return false;
  const now = Math.floor(Date.now() / 1000);
  return now < expirationTime;
}

/**
 * Calculate token expiration time
 */
export function getTokenExpirationTime(expirationTimeInSeconds: number): number {
  return Math.floor(Date.now() / 1000) + expirationTimeInSeconds;
}
