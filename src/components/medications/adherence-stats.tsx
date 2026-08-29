'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Medication, AdherenceRecord } from '@/firebase/firestore/medications';
import {
  calculateAdherenceStatistics,
  calculateDailyTrend,
  calculateStreak,
  getAdherenceRating,
  formatAdherenceRate,
} from '@/lib/adherence-calculator';
import { TrendingUp, TrendingDown, Minus, Award, Calendar, CheckCircle2, XCircle, SkipForward } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdherenceStatsProps {
  medications: Medication[];
  adherenceRecords: AdherenceRecord[];
  period?: 'week' | 'month' | 'all';
}

export function AdherenceStats({ medications, adherenceRecords, period = 'month' }: AdherenceStatsProps) {
  const now = new Date();
  const startDate = period === 'week' ? subDays(now, 7) : period === 'month' ? subDays(now, 30) : subDays(now, 365);

  const stats = useMemo(
    () => calculateAdherenceStatistics(medications, adherenceRecords, startDate, now),
    [medications, adherenceRecords, startDate, now]
  );

  const dailyTrend = useMemo(
    () => calculateDailyTrend(medications, adherenceRecords, period === 'week' ? 7 : 30),
    [medications, adherenceRecords, period]
  );

  const streak = useMemo(
    () => calculateStreak(medications, adherenceRecords),
    [medications, adherenceRecords]
  );

  const rating = getAdherenceRating(stats.overall);

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Adherence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{formatAdherenceRate(stats.overall)}</div>
            <Progress value={stats.overall} className="h-2" />
            <p className={`text-sm mt-2 ${rating.color}`}>{rating.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.trend === 'improving' && (
                <>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">Improving</div>
                    <p className="text-sm text-muted-foreground">Keep it up!</p>
                  </div>
                </>
              )}
              {stats.trend === 'stable' && (
                <>
                  <Minus className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">Stable</div>
                    <p className="text-sm text-muted-foreground">Consistent</p>
                  </div>
                </>
              )}
              {stats.trend === 'declining' && (
                <>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">Declining</div>
                    <p className="text-sm text-muted-foreground">Needs attention</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-3xl font-bold">{streak}</div>
                <p className="text-sm text-muted-foreground">
                  {streak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Taken
                </span>
                <span className="font-semibold">{stats.totalTaken}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Missed
                </span>
                <span className="font-semibold">{stats.totalMissed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <SkipForward className="h-4 w-4 text-yellow-600" />
                  Skipped
                </span>
                <span className="font-semibold">{stats.totalSkipped}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
          <CardDescription>Adherence breakdown by medication and period</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="medications">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="medications">By Medication</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
            </TabsList>

            <TabsContent value="medications" className="space-y-4 mt-4">
              {Object.values(stats.byMedication).map((medStats) => (
                <div key={medStats.medicationId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{medStats.medicationName}</p>
                      <p className="text-sm text-muted-foreground">
                        {medStats.taken} of {medStats.scheduled} doses taken
                      </p>
                    </div>
                    <Badge
                      variant={
                        medStats.rate >= 80
                          ? 'default'
                          : medStats.rate >= 60
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {formatAdherenceRate(medStats.rate)}
                    </Badge>
                  </div>
                  <Progress value={medStats.rate} className="h-2" />
                </div>
              ))}

              {Object.keys(stats.byMedication).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No medication data available for this period
                </p>
              )}
            </TabsContent>

            <TabsContent value="trend" className="mt-4">
              <div className="space-y-2">
                {dailyTrend.map((day, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-muted-foreground">
                      {format(day.date, 'MMM d')}
                    </div>
                    <div className="flex-1">
                      <Progress value={day.rate} className="h-2" />
                    </div>
                    <div className="w-16 text-sm text-right">
                      {day.taken}/{day.scheduled}
                    </div>
                    <div className="w-12 text-sm font-medium text-right">
                      {formatAdherenceRate(day.rate)}
                    </div>
                  </div>
                ))}

                {dailyTrend.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No trend data available
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Period Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Period Comparison</CardTitle>
          <CardDescription>Adherence rates across different time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Today</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={stats.byPeriod.today} className="h-2 w-32" />
                <span className="font-semibold w-16 text-right">
                  {formatAdherenceRate(stats.byPeriod.today)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">This Week</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={stats.byPeriod.week} className="h-2 w-32" />
                <span className="font-semibold w-16 text-right">
                  {formatAdherenceRate(stats.byPeriod.week)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">This Month</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={stats.byPeriod.month} className="h-2 w-32" />
                <span className="font-semibold w-16 text-right">
                  {formatAdherenceRate(stats.byPeriod.month)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
