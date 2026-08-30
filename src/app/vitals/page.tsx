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
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Heart, Activity } from 'lucide-react';
import type { VitalSign } from '@/lib/types';
import { collection } from 'firebase/firestore';

const vitalsChartConfig = {
  heartRate: {
    label: "Heart Rate (bpm)",
    color: "hsl(var(--primary))",
  },
  systolic: {
    label: "Systolic",
    color: "hsl(var(--chart-2))",
  },
  diastolic: {
    label: "Diastolic",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

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
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8 w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Metric Summary Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">
          <Card className="min-w-0 overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestVital?.heartRate || 'N/A'} bpm</div>
              <p className="text-xs text-muted-foreground mt-1">
                Latest recorded
              </p>
            </CardContent>
          </Card>
          
          <Card className="min-w-0 overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestVital ? `${latestVital.bloodPressure.systolic}/${latestVital.bloodPressure.diastolic}`: 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Systolic / Diastolic (mmHg)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        { isLoading ? (
          <p className="text-sm text-muted-foreground">Loading vitals data...</p>
        ) : memberVitals && memberVitals.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 w-full min-w-0">
            <Card className="min-w-0 overflow-hidden shadow-sm w-full max-w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Heart Rate Over Time</CardTitle>
                <CardDescription>Historical heart rate measurements (bpm)</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 w-full min-w-0 overflow-hidden">
                <ChartContainer config={vitalsChartConfig} className="min-h-[260px] sm:min-h-[300px] w-full max-w-full">
                  <LineChart data={memberVitals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      name="Heart Rate"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden shadow-sm w-full max-w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Blood Pressure Over Time</CardTitle>
                <CardDescription>Systolic & Diastolic readings (mmHg)</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 w-full min-w-0 overflow-hidden">
                <ChartContainer config={vitalsChartConfig} className="min-h-[260px] sm:min-h-[300px] w-full max-w-full">
                  <AreaChart data={memberVitals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="bloodPressure.systolic"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.25}
                      name="Systolic"
                    />
                    <Area
                      type="monotone"
                      dataKey="bloodPressure.diastolic"
                      stroke="hsl(var(--chart-5))"
                      fill="hsl(var(--chart-5))"
                      fillOpacity={0.25}
                      name="Diastolic"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No vital signs recorded for {selectedMember.firstName}.</p>
        )}
      </div>
    </AppLayout>
  );
}
