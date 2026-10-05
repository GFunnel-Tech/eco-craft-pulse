import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldAlert, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { SITE_NAME } from '@/lib/constants';

const changePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const passwordRequirements = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'One uppercase letter', regex: /[A-Z]/ },
  { label: 'One lowercase letter', regex: /[a-z]/ },
  { label: 'One number', regex: /[0-9]/ },
];

export default function ForceChangePassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile, refreshAuthState } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = form.watch('password');

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;

      // Clear the forced-change flag
      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('user_id', user.id);

      await refreshAuthState();

      toast({
        title: 'Password updated',
        description: 'Your new password has been set.',
      });
      navigate('/', { replace: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not update password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold font-display tracking-tight mb-8">{SITE_NAME}</h1>

          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-6">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight mb-2">
            Set a new password
          </h2>
          <p className="text-muted-foreground mb-8">
            {profile?.first_name ? `Hi ${profile.first_name}, for` : 'For'} security, you must create a new password before continuing.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a new password"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                {passwordRequirements.map((req, index) => {
                  const isValid = req.regex.test(password || '');
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        isValid ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          isValid ? 'bg-green-100' : 'bg-muted'
                        }`}
                      >
                        {isValid && <Check className="h-3 w-3" />}
                      </div>
                      {req.label}
                    </div>
                  );
                })}
              </div>

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Set new password'
                )}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
