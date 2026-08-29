'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { SupportTicket, subscribeToActiveTickets, updateTicketStatus } from '@/firebase/firestore/tickets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAgoraService } from '@/lib/agora/agora-service';

export function LiveAgentDashboard() {
  const firestore = useFirestore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    const unsubscribe = subscribeToActiveTickets(
      firestore,
      (newTickets) => setTickets(newTickets),
      (err) => setError('Failed to load tickets: ' + err.message)
    );

    return () => unsubscribe();
  }, [firestore]);

  const handleAcceptCall = async (ticketId: string) => {
    try {
      await updateTicketStatus(firestore, ticketId, 'in_progress', 'agent_1'); // In a real app, 'agent_1' would be the logged-in user's ID
      
      const agoraService = getAgoraService();
      await agoraService.connect({
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
        channel: ticketId,
        uid: 1000, // Agent UID
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Live Agent Dashboard</h2>
        <Badge variant="outline" className="px-4 py-1 text-sm bg-green-50 text-green-700 border-green-200">
          Agent Status: Online
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tickets.length === 0 ? (
          <div className="col-span-full text-center p-12 text-muted-foreground border rounded-lg border-dashed">
            No active escalations. You're all caught up!
          </div>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className={`border-l-4 ${ticket.status === 'open' ? 'border-l-red-500' : 'border-l-blue-500'} ${activeCallId === ticket.id ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{ticket.patientName}</CardTitle>
                  <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>
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
                  <div className="bg-muted p-2 rounded-md text-xs border border-amber-200 bg-amber-50 text-amber-900">
                    <span className="font-semibold">Reason:</span> {ticket.reason}
                  </div>
                )}

                <div className="flex flex-col space-y-2 pt-2">
                  {ticket.status === 'open' && (
                    <Button onClick={() => handleAcceptCall(ticket.id)} className="w-full bg-blue-600 hover:bg-blue-700" disabled={activeCallId !== null}>
                      Accept Call
                    </Button>
                  )}
                  {ticket.status === 'in_progress' && (
                    <>
                      {activeCallId === ticket.id && (
                        <Button onClick={toggleMute} variant={isMuted ? 'destructive' : 'secondary'} className="w-full">
                          {isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                        </Button>
                      )}
                      <Button onClick={() => handleResolveTicket(ticket.id)} variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
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
