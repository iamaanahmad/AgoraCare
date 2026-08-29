import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';


export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
    role: 'Caregiver' | 'Patient' | 'Child';
    hasBeenSeeded?: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  nextDose: string;
}

export interface Appointment {
  id: string;
  title: string;
  doctor: string;
  time: string;
  date: Timestamp;
}

export interface NavItem {
  href: string;
  title: string;
  icon: LucideIcon;
  label?: string;
}

export interface VitalSign {
    id: string;
    date: string;
    heartRate: number;
    bloodPressure: {
        systolic: number;
        diastolic: number;
    }
}
