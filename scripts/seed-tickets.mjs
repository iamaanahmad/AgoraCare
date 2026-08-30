import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function seed() {
  console.log('Adding mock tickets...');
  
  await addDoc(collection(db, 'support_tickets'), {
    patientId: 'george-patient-profile',
    patientName: 'George Patient',
    summary: 'Patient reported severe chest pain and shortness of breath during routine check-in.',
    reason: 'Emergency - Chest Pain',
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('Ticket 1 added');
  
  await addDoc(collection(db, 'support_tickets'), {
    patientId: 'sarah-patient-profile',
    patientName: 'Sarah Jenkins',
    summary: 'Patient is confused about the dosage for her new Lisinopril prescription.',
    reason: 'Medication Query',
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('Ticket 2 added');
  
  process.exit(0);
}

seed().catch(console.error);
