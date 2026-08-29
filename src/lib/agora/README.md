# Agora Voice Integration

This directory contains the Agora SDK integration for AgoraCare's voice interface functionality.

## Overview

The Agora integration provides real-time voice communication capabilities, enabling users to interact with the application using voice commands. This is a core feature for accessibility, especially for elderly users.

## Components

### 1. Agora Service (`agora-service.ts`)

The main service wrapper that manages:
- RTC client connection and disconnection
- Audio track management
- Event handling (user joined/left, connection state changes)
- Automatic reconnection logic
- Token renewal
- Volume indicators for voice activity detection

**Usage:**
```typescript
import { getAgoraService } from '@/lib/agora';

const agoraService = getAgoraService();

// Connect to a channel
await agoraService.connect({
  appId: 'your-app-id',
  channel: 'channel-name',
  uid: 'user-id',
  mode: 'rtc',
  codec: 'vp8',
});

// Mute/unmute microphone
await agoraService.setMuted(true);

// Disconnect
await agoraService.disconnect();
```

### 2. Token Generator (`token-generator.ts`)

Handles Agora token generation for secure channel access. In production, this should call your backend API that generates tokens using Agora's official token generation library.

**Development Mode:**
- If no app certificate is configured, returns an empty token (null token)
- This is only for development and should never be used in production

**Production Mode:**
- Calls `/api/agora/token` endpoint to generate secure tokens
- Tokens expire after a configurable time (default: 1 hour)
- Automatic token renewal before expiration

### 3. Types (`types.ts`)

TypeScript interfaces for:
- Voice configuration
- Conversation messages
- Voice intents
- Voice state
- Connection states
- Transcription results

## API Routes

### POST `/api/agora/token`

Generates RTC tokens for channel access.

**Request Body:**
```json
{
  "channelName": "string",
  "uid": "string | number",
  "role": "publisher | subscriber",
  "expirationTimeInSeconds": 3600
}
```

**Response:**
```json
{
  "token": "string",
  "appId": "string",
  "channel": "string",
  "uid": "string | number",
  "expiresAt": 1234567890
}
```

## Environment Variables

Required environment variables in `.env.local`:

```bash
# Agora Configuration (Required for voice features)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret
```

## Features

### Connection Management
- Automatic reconnection with exponential backoff
- Connection state tracking (disconnected, connecting, connected, reconnecting, failed)
- Maximum 3 reconnection attempts

### Audio Processing
- Acoustic Echo Cancellation (AEC)
- Automatic Noise Suppression (ANS)
- Automatic Gain Control (AGC)
- Speech-optimized encoding

### Event Handling
- User joined/left notifications
- Connection state changes
- Volume indicators for voice activity
- Token expiration warnings and automatic renewal

### Error Handling
- Graceful error handling with user-friendly messages
- Automatic cleanup on errors
- Error callbacks for custom handling

## Integration with Voice Context

The Agora service is integrated with the Voice Context Provider (`src/contexts/voice-context.tsx`), which provides:
- React hooks for voice functionality
- State management for voice interface
- Message history
- Recording state

**Usage in Components:**
```typescript
import { useVoice } from '@/contexts/voice-context';

function MyComponent() {
  const { 
    connect, 
    disconnect, 
    toggleMute, 
    voiceState,
    messages 
  } = useVoice();

  // Connect to voice channel
  await connect('my-channel', 'user-123');

  // Check connection state
  if (voiceState.isConnected) {
    // Voice is connected
  }
}
```

## Voice Commands Integration

Voice commands are processed through:
1. **Intent Classifier** (`src/lib/voice/intent-classifier.ts`) - Classifies user input into intents
2. **Conversation Manager** (`src/lib/voice/conversation-manager.ts`) - Manages multi-turn conversations
3. **Intent Router** (`src/lib/voice/intent-router.ts`) - Routes intents to appropriate handlers
4. **Medication Voice Handlers** (`src/lib/voice/medication-voice-handlers.ts`) - Handles medication-specific commands

## Security Considerations

1. **Token Security**: Never expose your Agora App Certificate in client-side code
2. **Token Expiration**: Tokens should expire after a reasonable time (1 hour recommended)
3. **Channel Access**: Implement proper authorization before allowing users to join channels
4. **User Validation**: Validate user identity before generating tokens

## Troubleshooting

### Connection Issues
- Verify Agora App ID is correct
- Check if token is valid (not expired)
- Ensure network connectivity
- Check browser permissions for microphone access

### Audio Issues
- Verify microphone permissions are granted
- Check if microphone is muted
- Ensure audio track is published
- Check volume indicators for voice activity

### Token Issues
- Verify App Certificate is configured correctly
- Check token expiration time
- Ensure token generation endpoint is accessible
- Verify channel name matches between token and connection

## Production Deployment

Before deploying to production:

1. **Install Agora Token Library**:
   ```bash
   npm install agora-access-token
   ```

2. **Implement Proper Token Generation**:
   Update `/api/agora/token/route.ts` to use the official library:
   ```typescript
   import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
   
   const token = RtcTokenBuilder.buildTokenWithUid(
     appId,
     appCertificate,
     channelName,
     uid,
     role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
     privilegeExpiredTs
   );
   ```

3. **Configure Environment Variables**: Set all required Agora credentials

4. **Enable HTTPS**: Agora requires HTTPS in production

5. **Test Token Renewal**: Verify automatic token renewal works correctly

## Resources

- [Agora RTC SDK Documentation](https://docs.agora.io/en/voice-calling/overview/product-overview)
- [Agora Token Generation](https://docs.agora.io/en/voice-calling/develop/authentication-workflow)
- [Agora React SDK Guide](https://docs.agora.io/en/voice-calling/develop/integrate-sdk)
