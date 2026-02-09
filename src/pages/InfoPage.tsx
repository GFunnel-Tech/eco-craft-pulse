import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { SITE_NAME } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';

interface InfoSection {
  title: string;
  content: string;
}

interface InfoPageProps {
  title: string;
  subtitle?: string;
  sections: InfoSection[];
}

export default function InfoPage({ title, subtitle, sections }: InfoPageProps) {
  return (
    <MainLayout>
      <main className="min-h-screen">
        <section className="bg-secondary py-16">
          <div className="container">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl md:text-4xl font-bold text-secondary-foreground"
            >
              {title}
            </motion.h1>
            {subtitle && <p className="mt-2 text-secondary-foreground/70">{subtitle}</p>}
          </div>
        </section>

        <div className="container py-12 max-w-3xl space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <h2 className="font-display text-xl font-semibold mb-3">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
              {i < sections.length - 1 && <Separator className="mt-8" />}
            </motion.div>
          ))}
        </div>
      </main>
    </MainLayout>
  );
}

// Pre-configured page exports
export function ShippingPage() {
  return (
    <InfoPage
      title="Shipping"
      subtitle={`Free shipping on all orders over $75`}
      sections={[
        { title: 'Domestic Shipping', content: `Standard shipping (5–7 business days): $5.99\nExpedited shipping (2–3 business days): $12.99\nOvernight shipping (1 business day): $24.99\n\nFree standard shipping on orders over $75.` },
        { title: 'International Shipping', content: 'We currently ship to select international destinations. International shipping rates and delivery times vary by location. Import duties and taxes may apply and are the responsibility of the customer.' },
        { title: 'Order Processing', content: 'Orders are processed within 1–2 business days. You will receive a confirmation email with tracking information once your order ships.' },
      ]}
    />
  );
}

export function ReturnsPage() {
  return (
    <InfoPage
      title="Returns & Exchanges"
      subtitle="Easy returns within 30 days"
      sections={[
        { title: 'Return Policy', content: `We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original packaging with tags attached.\n\nSale items are final sale and cannot be returned.` },
        { title: 'How to Return', content: `1. Log into your account and navigate to Order History\n2. Select the order and items you wish to return\n3. Print the prepaid return label\n4. Pack items securely and drop off at any carrier location\n\nRefunds are processed within 5–7 business days after we receive your return.` },
        { title: 'Exchanges', content: 'To exchange an item for a different size or color, please return the original item and place a new order. This ensures the fastest processing time.' },
      ]}
    />
  );
}

export function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      subtitle="We're here to help"
      sections={[
        { title: 'Email', content: `For general inquiries: support@korrapparel.com\nFor wholesale inquiries: wholesale@korrapparel.com\n\nWe respond to all emails within 24–48 business hours.` },
        { title: 'Social Media', content: 'Reach us on Instagram @korrapparel or on Facebook. Our social team is active Monday through Friday.' },
        { title: 'Business Hours', content: 'Monday – Friday: 9:00 AM – 6:00 PM EST\nSaturday – Sunday: Closed' },
      ]}
    />
  );
}

export function FAQPage() {
  return (
    <InfoPage
      title="Frequently Asked Questions"
      sections={[
        { title: 'What sizes do you carry?', content: 'We carry sizes XS through XXL in most styles. Please refer to our size guide on each product page for detailed measurements.' },
        { title: 'How do I track my order?', content: 'Once your order ships, you will receive an email with a tracking number and link. You can also view tracking information in your account under Order History.' },
        { title: 'Do you offer gift cards?', content: 'Gift cards are coming soon! Sign up for our newsletter to be the first to know.' },
        { title: 'How do I care for my apparel?', content: 'We recommend machine washing cold with like colors and tumble drying on low. Avoid bleach and fabric softeners to preserve fabric performance. Check each product page for specific care instructions.' },
        { title: 'Can I cancel or modify my order?', content: 'Orders can be cancelled or modified within 1 hour of placing them. After that, orders enter processing and cannot be changed. Contact us immediately if you need assistance.' },
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      subtitle={`Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
      sections={[
        { title: 'Information We Collect', content: `We collect information you provide directly, including your name, email address, shipping address, and payment information when you make a purchase. We also collect browsing data and device information automatically.` },
        { title: 'How We Use Your Information', content: `We use your information to process orders, communicate with you about your purchases, send marketing communications (with your consent), and improve our products and services.` },
        { title: 'Data Protection', content: `We implement industry-standard security measures to protect your personal information. Payment processing is handled by trusted third-party providers and we never store your full payment details.` },
        { title: 'Your Rights', content: `You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at support@korrapparel.com.` },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      subtitle={`Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
      sections={[
        { title: 'Acceptance of Terms', content: `By accessing and using the ${SITE_NAME} website, you agree to be bound by these Terms of Service. If you do not agree, please do not use our site.` },
        { title: 'Products & Pricing', content: `All prices are listed in USD and are subject to change without notice. We reserve the right to limit quantities and refuse any order. Colors may vary slightly from what appears on screen.` },
        { title: 'Intellectual Property', content: `All content on this site, including logos, images, text, and designs, is the property of ${SITE_NAME} and is protected by copyright law. Unauthorized use is prohibited.` },
        { title: 'Limitation of Liability', content: `${SITE_NAME} shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or products.` },
      ]}
    />
  );
}
