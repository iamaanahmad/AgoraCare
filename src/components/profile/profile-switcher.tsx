'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/firebase/firestore/users';
import { cn } from '@/lib/utils';
import { UserPlus, Check } from 'lucide-react';

interface ProfileSwitcherProps {
  profiles: UserProfile[];
  activeProfile: UserProfile;
  onProfileSelect: (profile: UserProfile) => void;
  onAddProfile?: () => void;
  showAddButton?: boolean;
}

export function ProfileSwitcher({
  profiles,
  activeProfile,
  onProfileSelect,
  onAddProfile,
  showAddButton = true,
}: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);

  const handleProfileSelect = (profile: UserProfile) => {
    onProfileSelect(profile);
    setOpen(false);
  };

  const getAgeCategoryLabel = (category: string) => {
    switch (category) {
      case 'child':
        return 'Child';
      case 'adult':
        return 'Adult';
      case 'elder':
        return 'Elder';
      default:
        return category;
    }
  };

  const getAgeCategoryColor = (category: string) => {
    switch (category) {
      case 'child':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'adult':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'elder':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Profiles</CardTitle>
        <CardDescription>Switch between family member profiles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          {/* Active Profile Display */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center space-y-2 rounded-lg p-3 transition-all',
                  'border-2 border-primary bg-accent hover:bg-accent/80'
                )}
              >
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={activeProfile.avatar} alt={activeProfile.name} />
                    <AvatarFallback className="text-lg">
                      {activeProfile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{activeProfile.name}</p>
                  <Badge
                    variant="secondary"
                    className={cn('mt-1 text-xs', getAgeCategoryColor(activeProfile.ageCategory))}
                  >
                    {getAgeCategoryLabel(activeProfile.ageCategory)}
                  </Badge>
                </div>
              </button>
            </DialogTrigger>

            {/* Profile Selection Dialog */}
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Select Profile</DialogTitle>
                <DialogDescription>
                  Choose which family member's information to view and manage
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile)}
                    className={cn(
                      'flex flex-col items-center space-y-3 rounded-lg border-2 p-4 transition-all hover:bg-accent',
                      activeProfile.id === profile.id
                        ? 'border-primary bg-accent'
                        : 'border-transparent'
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                        <AvatarFallback className="text-xl">
                          {profile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {activeProfile.id === profile.id && (
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{profile.name}</p>
                      <Badge
                        variant="secondary"
                        className={cn('mt-1 text-xs', getAgeCategoryColor(profile.ageCategory))}
                      >
                        {getAgeCategoryLabel(profile.ageCategory)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Other Profiles Quick Access */}
          {profiles
            .filter((p) => p.id !== activeProfile.id)
            .slice(0, 3)
            .map((profile) => (
              <button
                key={profile.id}
                onClick={() => onProfileSelect(profile)}
                className={cn(
                  'flex flex-col items-center space-y-2 rounded-lg p-3 transition-all',
                  'border-2 border-transparent hover:border-muted-foreground/20 hover:bg-accent'
                )}
              >
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-medium text-sm">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getAgeCategoryLabel(profile.ageCategory)}
                  </p>
                </div>
              </button>
            ))}

          {/* Add Profile Button */}
          {showAddButton && onAddProfile && (
            <Button
              variant="outline"
              onClick={onAddProfile}
              className="flex h-auto flex-col items-center justify-center space-y-2 rounded-lg border-dashed p-3"
              style={{ minHeight: '124px', minWidth: '96px' }}
            >
              <UserPlus className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">Add</p>
                <p className="text-xs text-muted-foreground">Profile</p>
              </div>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
