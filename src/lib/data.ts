import type { NavItem } from '@/lib/types';
import { Home, Pill, Calendar, FileScan, HeartPulse, Headset } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export const navItems: NavItem[] = [
    {
        href: '/',
        title: 'Dashboard',
        icon: Home,
    },
    {
        href: '/medications',
        title: 'Medications',
        icon: Pill,
    },
    {
        href: '/appointments',
        title: 'Appointments',
        icon: Calendar,
    },
    {
        href: '/vitals',
        title: 'Vitals',
        icon: HeartPulse,
    },
    {
        href: '/prescriptions',
        title: 'Prescriptions',
        icon: FileScan,
    },
    {
        href: '/agent',
        title: 'Agent Dashboard',
        icon: Headset,
    }
];

// Get tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const nextWeek = new GetDatePlus(7);

function GetDatePlus(days:number) {
    let date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}


export const initialAppointments = [
  {
    title: 'Annual Check-up',
    doctor: 'Dr. Evelyn Reed',
    time: '10:00 AM',
    date: Timestamp.fromDate(new Date()),
  },
  {
    title: 'Dental Cleaning',
    doctor: 'Dr. Michael Chen',
    time: '02:30 PM',
    date: Timestamp.fromDate(tomorrow),
  },
  {
    title: 'Follow-up',
    doctor: 'Dr. Evelyn Reed',
    time: '11:00 AM',
    date: Timestamp.fromDate(nextWeek),
  },
];

export const initialMedications = [
    { name: 'Lisinopril', dosage: '10mg', schedule: 'Once daily', nextDose: '8:00 AM' },
    { name: 'Metformin', dosage: '500mg', schedule: 'Twice daily', nextDose: '8:00 AM' },
    { name: 'Simvastatin', dosage: '20mg', schedule: 'Once daily', nextDose: '8:00 PM' },
    { name: 'Amlodipine', dosage: '5mg', schedule: 'Once daily', nextDose: '8:00 AM' },
];

export const initialVitals = [
    { date: '2024-05-01', heartRate: 72, bloodPressure: { systolic: 120, diastolic: 80 } },
    { date: '2024-05-02', heartRate: 75, bloodPressure: { systolic: 122, diastolic: 81 } },
    { date: '2024-05-03', heartRate: 70, bloodPressure: { systolic: 118, diastolic: 79 } },
    { date: '2024-05-04', heartRate: 78, bloodPressure: { systolic: 125, diastolic: 83 } },
    { date: '2024-05-05', heartRate: 74, bloodPressure: { systolic: 121, diastolic: 80 } },
    { date: '2024-05-06', heartRate: 76, bloodPressure: { systolic: 124, diastolic: 82 } },
    { date: '2024-05-07', heartRate: 73, bloodPressure: { systolic: 119, diastolic: 78 } },
];
