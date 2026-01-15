import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function AccountProfile() {
  const { user, profile, updateProfile } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(profile?.marketing_opt_in || false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    
    const { error } = await updateProfile({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || null,
    });

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated');
    }
    
    setIsUpdatingProfile(false);
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdatingPassword(true);
    
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated');
      passwordForm.reset();
    }
    
    setIsUpdatingPassword(false);
  };

  const handleMarketingOptIn = async (checked: boolean) => {
    setMarketingOptIn(checked);
    
    const { error } = await updateProfile({
      marketing_opt_in: checked,
    });

    if (error) {
      toast.error('Failed to update preferences');
      setMarketingOptIn(!checked);
    } else {
      toast.success('Preferences updated');
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Personal Information */}
      <section className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Personal Information</h2>
        </div>
        
        <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...profileForm.register('firstName')}
                className="mt-1"
              />
              {profileForm.formState.errors.firstName && (
                <p className="text-sm text-destructive mt-1">
                  {profileForm.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...profileForm.register('lastName')}
                className="mt-1"
              />
              {profileForm.formState.errors.lastName && (
                <p className="text-sm text-destructive mt-1">
                  {profileForm.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1 pl-10 bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                {...profileForm.register('phone')}
                className="mt-1 pl-10"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <Button type="submit" disabled={isUpdatingProfile}>
            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </section>

      {/* Password */}
      <section className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
        
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              {...passwordForm.register('currentPassword')}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              {...passwordForm.register('newPassword')}
              className="mt-1"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-sm text-destructive mt-1">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...passwordForm.register('confirmPassword')}
              className="mt-1"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isUpdatingPassword}>
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </section>

      {/* Communication Preferences */}
      <section className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Communication Preferences</h2>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Marketing emails</p>
            <p className="text-sm text-muted-foreground">
              Receive emails about new products, sales, and exclusive offers
            </p>
          </div>
          <Switch
            checked={marketingOptIn}
            onCheckedChange={handleMarketingOptIn}
          />
        </div>
      </section>

      {/* Account Info */}
      <section className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p>
          Member since{' '}
          {new Date(user?.created_at || '').toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </section>
    </div>
  );
}
