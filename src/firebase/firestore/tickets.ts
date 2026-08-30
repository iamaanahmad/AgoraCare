import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Firestore,
  Timestamp
} from 'firebase/firestore';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  patientId: string;
  patientName: string;
  summary: string;
  reason: string;
  status: TicketStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  assignedTo?: string;
  agoraChannel?: string;
}

const TICKETS_COLLECTION = 'support_tickets';

/**
 * Creates a new support ticket (usually triggered by AI escalation).
 */
export async function createSupportTicket(
  firestore: Firestore,
  ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ticketsRef = collection(firestore, TICKETS_COLLECTION);
  const newTicketRef = doc(ticketsRef);
  
  await setDoc(newTicketRef, {
    ...ticketData,
    id: newTicketRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return newTicketRef.id;
}

/**
 * Updates an existing support ticket's status.
 */
export async function updateTicketStatus(
  firestore: Firestore,
  ticketId: string,
  status: TicketStatus,
  assignedTo?: string
): Promise<void> {
  const ticketRef = doc(firestore, TICKETS_COLLECTION, ticketId);
  const updates: Partial<SupportTicket> = {
    status,
    updatedAt: serverTimestamp() as Timestamp,
  };
  
  if (assignedTo) {
    updates.assignedTo = assignedTo;
  }
  
  await updateDoc(ticketRef, updates as any);
}

/**
 * Subscribes to all active (open or in_progress) support tickets.
 * Used by the Live Agent Dashboard.
 */
export function subscribeToActiveTickets(
  firestore: Firestore,
  onUpdate: (tickets: SupportTicket[]) => void,
  onError?: (error: Error) => void
) {
  const ticketsRef = collection(firestore, TICKETS_COLLECTION);
  // We want to fetch tickets that need attention. We can filter by status in client or query.
  // Using an IN query for status 'open' and 'in_progress'.
  const q = query(
    ticketsRef,
    where('status', 'in', ['open', 'in_progress']),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets: SupportTicket[] = [];
      snapshot.forEach((doc) => {
        tickets.push({ id: doc.id, ...doc.data() } as SupportTicket);
      });
      onUpdate(tickets);
    },
    (error) => {
      console.error('Error listening to tickets:', error);
      if (onError) onError(error);
    }
  );
}
