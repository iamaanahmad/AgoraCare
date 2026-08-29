'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@/firebase/firestore/users';
import { Loader2, Upload } from 'lucide-react';

interface ProfileFormProps {
  profile?: UserProfile;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface ProfileFormData {
  name: string;
  dateOfBirth?: Date;
  ageCategory: 'child' | 'adult' | 'elder';
  avatar?: string;
}

export function ProfileForm({ profile, onSubmit, onCancel, isLoading }: ProfileFormProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile?.avatar);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile?.name || '',
      dateOfBirth: profile?.dateOfBirth,
      ageCategory: profile?.ageCategory || 'adult',
      avatar: profile?.avatar,
    },
  });

  const ageCategory = watch('ageCategory');

  const handleFormSubmit = async (data: ProfileFormData) => {
    await onSubmit(data);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setValue('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{profile ? 'Edit Profile' : 'Create New Profile'}</CardTitle>
          <CardDescription>
            {profile ? 'Update profile information' : 'Add a new family member profile'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview} alt={watch('name') || 'Profile'} />
              <AvatarFallback className="text-2xl">
                {watch('name')?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center space-x-2 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  <span>Upload Photo</span>
                </div>
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter full name"
              className="text-base"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Age Category */}
          <div className="space-y-2">
            <Label htmlFor="ageCategory">Age Category *</Label>
            <Select
              value={ageCategory}
              onValueChange={(value) => setValue('ageCategory', value as 'child' | 'adult' | 'elder')}
            >
              <SelectTrigger id="ageCategory" className="text-base">
                <SelectValue placeholder="Select age category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="child">Child (0-17 years)</SelectItem>
                <SelectItem value="adult">Adult (18-64 years)</SelectItem>
                <SelectItem value="elder">Elder (65+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth', {
                setValueAs: (value) => (value ? new Date(value) : undefined),
              })}
              className="text-base"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {(isSubmitting || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
