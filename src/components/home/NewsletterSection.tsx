import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email });

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast.info("You're already subscribed!");
      } else {
        toast.error('Something went wrong. Please try again.');
      }
      return;
    }

    toast.success('Welcome to the KORR family!');
    setEmail('');
  };

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8" />
          </div>
          
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Stay in the Loop
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Subscribe for exclusive offers, new arrivals, and the inside scoop on all things Coral.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 h-12"
              required
            />
            <Button 
              type="submit" 
              variant="secondary"
              size="lg"
              disabled={isSubmitting}
              className="whitespace-nowrap"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-primary-foreground/60 mt-4">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}