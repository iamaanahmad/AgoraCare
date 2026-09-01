'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { SupportTicket, subscribeToActiveTickets, updateTicketStatus } from '@/firebase/firestore/tickets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAgoraService } from '@/lib/agora/agora-service';
import { Volume2, VolumeX, PhoneCall, AlertTriangle, Radio } from 'lucide-react';

export function LiveAgentDashboard() {
  const firestore = useFirestore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioAlertEnabled, setIsAudioAlertEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);

  // Initialize Web Audio context on user interaction
  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play a crisp, pleasant medical alert ring chime
  const playEmergencyChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Medical chime tri-tone chord (880Hz A5 + 1174Hz D6 + 1318Hz E6)
      const tones = [
        { freq: 880, start: now, duration: 0.35, gain: 0.18 },
        { freq: 1174.66, start: now + 0.12, duration: 0.4, gain: 0.22 },
        { freq: 1318.51, start: now + 0.24, duration: 0.55, gain: 0.25 },
      ];

      tones.forEach(({ freq, start, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(gain, start + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch (e) {
      console.warn('Audio tone play notice:', e);
    }
  };

  const startRingtone = () => {
    if (ringIntervalRef.current) return;
    playEmergencyChime();
    ringIntervalRef.current = setInterval(() => {
      playEmergencyChime();
    }, 2600);
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  };

  // Subscribe to tickets in Firestore
  useEffect(() => {
    if (!firestore) return;

    const unsubscribe = subscribeToActiveTickets(
      firestore,
      (newTickets) => {
        setTickets(newTickets);
      },
      (err) => setError('Failed to load tickets: ' + err.message)
    );

    return () => {
      unsubscribe();
      stopRingtone();
    };
  }, [firestore]);

  // Manage incoming call ringtone based on open tickets
  useEffect(() => {
    const hasOpenIncomingCall = tickets.some(t => t.status === 'open') && activeCallId === null;

    if (hasOpenIncomingCall && isAudioAlertEnabled) {
      startRingtone();
    } else {
      stopRingtone();
    }

    return () => stopRingtone();
  }, [tickets, activeCallId, isAudioAlertEnabled]);

  const handleAcceptCall = async (ticketId: string) => {
    stopRingtone();
    try {
      await updateTicketStatus(firestore, ticketId, 'in_progress', 'agent_1');
      
      const agentUid = 1000;
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: ticketId, uid: agentUid }),
      });
      
      const { token } = await response.json();
      
      const agoraService = getAgoraService();
      await agoraService.connect({
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
        channel: ticketId,
        uid: agentUid,
        token: token || undefined,
      });
      
      setActiveCallId(ticketId);
    } catch (err) {
      console.error('Error accepting call:', err);
      alert('Failed to connect to the call.');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      if (activeCallId === ticketId) {
        const agoraService = getAgoraService();
        await agoraService.disconnect();
        setActiveCallId(null);
      }
      await updateTicketStatus(firestore, ticketId, 'resolved');
    } catch (err) {
      console.error('Error resolving ticket:', err);
    }
  };

  const toggleMute = async () => {
    try {
      const agoraService = getAgoraService();
      await agoraService.setMuted(!isMuted);
      setIsMuted(!isMuted);
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Top Bar with Online & Ringtone Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Nurse / Agent Dashboard</h2>
          <p className="text-sm text-muted-foreground">Monitor real-time AgoraCare patient emergency escalations.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Ringtone Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              getAudioContext();
              setIsAudioAlertEnabled(!isAudioAlertEnabled);
              if (!isAudioAlertEnabled) {
                playEmergencyChime();
              }
            }}
            className="flex items-center gap-2 h-9"
          >
            {isAudioAlertEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span className="text-xs font-medium">Alert Tone: On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-muted-foreground">Alert Tone: Muted</span>
              </>
            )}
          </Button>

          <Badge variant="outline" className="px-3.5 py-1.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Online & Ready
          </Badge>
        </div>
      </div>

      {/* Incoming Call Ringing Banner */}
      {openTicketsCount > 0 && activeCallId === null && (
        <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 text-white rounded-lg animate-bounce">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-red-700 dark:text-red-400">
                🚨 Incoming Emergency Call ({openTicketsCount} patient{openTicketsCount > 1 ? 's' : ''} waiting)
              </p>
              <p className="text-xs text-red-600/80">
                Notification chime active. Click "Accept Call" to connect real-time Agora audio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets.length === 0 ? (
          <div className="col-span-full text-center p-12 text-muted-foreground border rounded-lg border-dashed">
            No active escalations. You're all caught up!
          </div>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className={`border-l-4 transition-all ${ticket.status === 'open' ? 'border-l-red-500 shadow-md ring-1 ring-red-500/20' : 'border-l-blue-500'} ${activeCallId === ticket.id ? 'ring-2 ring-emerald-500 shadow-lg' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">{ticket.patientName}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Room: {ticket.agoraChannel || ticket.id}</p>
                  </div>
                  <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'} className={ticket.status === 'open' ? 'animate-pulse' : ''}>
                    {activeCallId === ticket.id ? 'ON CALL' : ticket.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  {ticket.createdAt instanceof Date 
                    ? ticket.createdAt.toLocaleTimeString() 
                    : ticket.createdAt?.toDate?.().toLocaleTimeString() || 'Just now'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Issue Summary:</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.summary}</p>
                </div>
                
                {ticket.reason && (
                  <div className="p-2.5 rounded-md text-xs border border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-semibold">Reason:</span> {ticket.reason}
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-2 pt-2">
                  {ticket.status === 'open' && (
                    <Button 
                      onClick={() => handleAcceptCall(ticket.id)} 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
                      disabled={activeCallId !== null}
                    >
                      <PhoneCall className="h-4 w-4" />
                      Accept Call (Connect Agora Voice)
                    </Button>
                  )}
                  {ticket.status === 'in_progress' && (
                    <>
                      {activeCallId === ticket.id && (
                        <div className="flex items-center gap-2">
                          <Button onClick={toggleMute} variant={isMuted ? 'destructive' : 'secondary'} className="flex-1">
                            {isMuted ? 'Unmute Mic' : 'Mute Mic'}
                          </Button>
                        </div>
                      )}
                      <Button onClick={() => handleResolveTicket(ticket.id)} variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-50">
                        End Call & Resolve
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
