import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      } else {
        setIsSuccess(true);
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
                  Check your email
                </h2>
                <p className="text-muted-foreground mb-8">
                  We've sent a password reset link to{' '}
                  <span className="font-medium text-foreground">{form.getValues('email')}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-primary hover:underline"
                  >
                    try again
                  </button>
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Return to login</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-6">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                
                <h2 className="text-2xl font-semibold tracking-tight mb-2">
                  Forgot your password?
                </h2>
                <p className="text-muted-foreground mb-8">
                  No worries! Enter your email and we'll send you a reset link.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              autoComplete="email"
                              {...field}
                            />
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
                          Sending...
                        </>
                      ) : (
                        'Send reset link'
                      )}
                    </Button>
                  </form>
                </Form>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link
                    to="/login"
                    className="text-primary font-medium hover:text-primary/80 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
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
                We've Got You Covered
              </h2>
              <p className="text-lg text-white/80 max-w-md">
                Resetting your password is quick and easy. 
                You'll be back to shopping in no time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
