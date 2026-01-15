import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if user came from a valid reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // The user should have a session after clicking the reset link
      setIsValidSession(!!session);
    };
    
    checkSession();

    // Listen for auth events (password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const password = form.watch('password');
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      } else {
        setIsSuccess(true);
        // Sign out after password reset
        await supabase.auth.signOut();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-6">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Invalid or expired link</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button asChild>
            <Link to="/forgot-password">Request new link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="block mb-8">
              <h1 className="text-3xl font-bold font-display tracking-tight">
                {SITE_NAME}
              </h1>
            </Link>

            {isSuccess ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2">
                  Password reset successful!
                </h2>
                <p className="text-muted-foreground mb-8">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <Button asChild className="w-full bg-gradient-coral">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-6">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                
                <h2 className="text-2xl font-semibold tracking-tight mb-2">
                  Set new password
                </h2>
                <p className="text-muted-foreground mb-8">
                  Create a strong password for your account.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          {password && (
                            <div className="mt-2">
                              <div className="flex gap-1 mb-1">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                      passwordStrength >= level
                                        ? passwordStrength <= 1
                                          ? 'bg-destructive'
                                          : passwordStrength <= 2
                                          ? 'bg-orange-500'
                                          : passwordStrength <= 3
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                        : 'bg-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {passwordStrength <= 1 && 'Weak'}
                                {passwordStrength === 2 && 'Fair'}
                                {passwordStrength === 3 && 'Good'}
                                {passwordStrength === 4 && 'Strong'}
                              </p>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-coral hover:opacity-90 transition-opacity"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Reset password'
                      )}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:flex-1 relative">
        <div className="absolute inset-0 bg-secondary">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/80" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center text-white">
              <h2 className="text-4xl font-display font-bold mb-4">
                Secure Your Account
              </h2>
              <p className="text-lg text-white/80 max-w-md">
                Choose a strong password to keep your account safe 
                and your shopping experience seamless.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
