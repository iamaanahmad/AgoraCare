'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileHealthSummary } from '@/lib/dashboard/dashboard-aggregation-service';
import {
  User,
  Pill,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileHealthCardProps {
  summary: ProfileHealthSummary;
  onViewDetails?: () => void;
}

export function ProfileHealthCard({ summary, onViewDetails }: ProfileHealthCardProps) {
  const { profile, medicationCount, adherenceRate, nextMedication, nextAppointment, recentAlerts } = summary;

  // Determine adherence status
  const getAdherenceStatus = (rate: number) => {
    if (rate >= 90) return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (rate >= 70) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (rate >= 50) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { label: 'Needs Attention', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const adherenceStatus = getAdherenceStatus(adherenceRate);

  // Get age category badge color
  const getAgeCategoryColor = (category: string) => {
    switch (category) {
      case 'elder':
        return 'bg-purple-100 text-purple-800';
      case 'adult':
        return 'bg-blue-100 text-blue-800';
      case 'child':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl">{profile.name}</CardTitle>
              <Badge className={cn('mt-1', getAgeCategoryColor(profile.ageCategory))}>
                {profile.ageCategory.charAt(0).toUpperCase() + profile.ageCategory.slice(1)}
              </Badge>
            </div>
          </div>
          {recentAlerts.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {recentAlerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Adherence Rate */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', adherenceStatus.color)} />
            <span className="text-sm font-medium">Adherence Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-lg font-bold', adherenceStatus.textColor)}>
              {adherenceRate}%
            </span>
            <span className="text-xs text-gray-500">{adherenceStatus.label}</span>
          </div>
        </div>

        {/* Medications */}
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Pill className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Active Medications</p>
            <p className="text-xs text-gray-500">
              {medicationCount} {medicationCount === 1 ? 'medication' : 'medications'}
            </p>
          </div>
          {nextMedication && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Next dose</p>
              <p className="text-sm font-medium">{formatTime(nextMedication.scheduledTime)}</p>
            </div>
          )}
        </div>

        {/* Next Appointment */}
        {nextAppointment && (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{nextAppointment.doctorName}</p>
              <p className="text-xs text-gray-500">{nextAppointment.specialization}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {formatDate(nextAppointment.dateTime)}
              </p>
            </div>
          </div>
        )}

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Recent Alerts</p>
            {recentAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded text-xs',
                  alert.severity === 'critical' && 'bg-red-50 text-red-800',
                  alert.severity === 'warning' && 'bg-yellow-50 text-yellow-800',
                  alert.severity === 'info' && 'bg-blue-50 text-blue-800'
                )}
              >
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="flex-1">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* View Details Button */}
        {onViewDetails && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onViewDetails}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
