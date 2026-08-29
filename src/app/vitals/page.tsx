'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFamily } from '@/contexts/family-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
  Line,
} from 'recharts';
import { ChartTooltipContent } from '@/components/ui/chart';
import { Heart, Activity } from 'lucide-react';
import type { VitalSign } from '@/lib/types';
import { collection } from 'firebase/firestore';

export default function VitalsPage() {
  const { selectedMember } = useFamily();
  const firestore = useFirestore();

  const vitalsRef = useMemoFirebase(
      () => collection(firestore, 'users', selectedMember.id, 'vitals'),
      [firestore, selectedMember.id]
  );
  const { data: memberVitals, isLoading } = useCollection<VitalSign>(vitalsRef);
  
  const latestVital = memberVitals && memberVitals.length > 0 ? memberVitals[memberVitals.length - 1] : null;

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{latestVital?.heartRate ?? 'N/A'} bpm</div>
                    <p className="text-xs text-muted-foreground">
                        Latest reading
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{latestVital ? `${latestVital.bloodPressure.systolic}/${latestVital.bloodPressure.diastolic}`: 'N/A'}</div>
                     <p className="text-xs text-muted-foreground">
                        Systolic / Diastolic (mmHg)
                    </p>
                </CardContent>
            </Card>
        </div>
        { isLoading ? <p>Loading vitals...</p> : memberVitals && memberVitals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Heart Rate Over Time</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={memberVitals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'bpm', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Heart Rate"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Blood Pressure Over Time</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={memberVitals}>
                   <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="bloodPressure.systolic"
                    stackId="1"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2), 0.4)"
                    name="Systolic"
                  />
                  <Area
                    type="monotone"
                    dataKey="bloodPressure.diastolic"
                    stackId="1"
                    stroke="hsl(var(--chart-5))"
                    fill="hsl(var(--chart-5), 0.4)"
                    name="Diastolic"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        ) : (
            <p>No vital signs recorded for {selectedMember.firstName}.</p>
        )}
      </div>
    </AppLayout>
  );
}
