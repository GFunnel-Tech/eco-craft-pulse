import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NAVIGATION, SITE_NAME, SITE_TAGLINE } from '@/lib/constants';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    
    const { error } = await supabase.functions.invoke('klaviyo-subscribe', {
      body: { email },
    });
    
    setIsSubscribing(false);
    
    if (error) {
      toast.error('Failed to subscribe. Please try again.');
      return;
    }
    
    toast.success('Thanks for subscribing!');
    setEmail('');
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block">
              <h3 className="font-display text-2xl font-medium text-primary-foreground">
                {SITE_NAME}
              </h3>
            </Link>
            <p className="mt-2 text-sm text-primary-foreground/70 font-sans">
              {SITE_TAGLINE}
            </p>
            <p className="mt-4 text-sm text-primary-foreground/60 leading-relaxed font-sans">
              Premium performance apparel designed for athletes who demand excellence. 
              Engineered for comfort, built for performance.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <a
                href="https://www.instagram.com/korrapparel/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-muted-foreground hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/people/KORR/61575679605898/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-muted-foreground hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-sans font-semibold text-primary-foreground mb-4">Shop</h4>
            <ul className="space-y-3">
              {NAVIGATION.categories.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-primary-foreground/70 hover:text-muted-foreground transition-colors font-sans"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/shop?filter=new"
                  className="text-sm text-primary-foreground/70 hover:text-muted-foreground transition-colors font-sans"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?filter=sale"
                  className="text-sm text-primary-foreground/70 hover:text-muted-foreground transition-colors font-sans"
                >
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-sans font-semibold text-primary-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              {NAVIGATION.support.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-primary-foreground/70 hover:text-muted-foreground transition-colors font-sans"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-sans font-semibold text-primary-foreground mb-4">Stay in the Loop</h4>
            <p className="text-sm text-primary-foreground/70 mb-4 font-sans">
              Subscribe to get special offers, free giveaways, and new arrivals.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 font-sans"
                required
              />
              <Button 
                type="submit" 
                variant="secondary"
                className="w-full font-sans"
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60 font-sans">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {NAVIGATION.legal.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm text-primary-foreground/60 hover:text-muted-foreground transition-colors font-sans"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}