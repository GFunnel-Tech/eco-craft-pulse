import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, RefreshCw, Shield, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import groupFitnessImage from '@/assets/group-fitness.jpg';
import navyPoseImage from '@/assets/navy-pose.jpg';

const FEATURES = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $100',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: 'Safe & encrypted',
  },
  {
    icon: Headphones,
    title: 'Expert Support',
    description: 'Here to help 24/7',
  },
];

export function PromoSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    const { error } = await supabase.functions.invoke('klaviyo-subscribe', {
      body: { email },
    });

    setIsSubmitting(false);

    if (error) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    toast.success('Welcome to the KORR family!');
    setEmail('');
  };

  return (
    <>
      {/* Lifestyle Image Banner */}
      <section className="py-0 bg-background">
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <motion.div
              className="relative aspect-[3/4] rounded-lg overflow-hidden"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src={navyPoseImage}
                alt="KORR athletic wear - navy collection"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-display text-2xl text-primary-foreground font-medium">Built to Move</h3>
                <p className="text-primary-foreground/80 font-sans text-sm mt-1">Performance meets style</p>
              </div>
            </motion.div>
            <motion.div
              className="relative aspect-[3/4] rounded-lg overflow-hidden"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src={groupFitnessImage}
                alt="KORR team fitness collection"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-display text-2xl text-primary-foreground font-medium">Stronger Together</h3>
                <p className="text-primary-foreground/80 font-sans text-sm mt-1">Train with confidence</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Banner */}
      <section className="py-12 bg-soft-grey border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-sans font-semibold text-primary">{feature.title}</h3>
                <p className="text-sm text-muted-foreground font-sans">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner with Email Signup */}
      <section className="py-24 bg-secondary text-secondary-foreground relative overflow-hidden">
        <div className="container relative z-10">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-foreground/10 text-secondary-foreground text-sm font-medium mb-6 font-sans tracking-wide">
              Limited Time Offer
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-medium text-secondary-foreground mb-4">
              20% Off Your First Order
            </h2>
            <p className="text-lg text-secondary-foreground/70 mb-8 font-sans">
              Join our community and get exclusive access to new drops, limited editions, and member-only discounts.
            </p>
            
            {/* Email Signup Form */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 h-12 font-sans"
                required
              />
              <Button 
                type="submit" 
                size="lg"
                disabled={isSubmitting}
                className="whitespace-nowrap font-sans"
              >
                {isSubmitting ? 'Joining...' : 'Get 20% Off'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                variant="outline-inverse" 
                className="text-base px-8 font-sans"
                asChild
              >
                <Link to="/shop">
                  Shop Collection
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
