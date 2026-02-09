import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { SITE_NAME } from '@/lib/constants';
import groupFitness from '@/assets/group-fitness.jpg';
import navyPose from '@/assets/navy-pose.jpg';

export default function About() {
  return (
    <MainLayout>
      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative h-[40vh] min-h-[320px] bg-secondary overflow-hidden">
          <img src={groupFitness} alt="About KORR" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent" />
          <div className="relative container h-full flex flex-col justify-end pb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold text-secondary-foreground"
            >
              About {SITE_NAME}
            </motion.h1>
          </div>
        </section>

        <div className="container py-16 max-w-4xl space-y-16">
          {/* Mission */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-display text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              At {SITE_NAME}, we believe that great performance starts with what you wear. Our mission is to create premium athletic apparel that empowers athletes at every level to push beyond their limits. Every stitch, every fabric choice, and every design detail is engineered with purpose — to move with you, not against you.
            </p>
          </motion.section>

          {/* Image Break */}
          <div className="grid md:grid-cols-2 gap-6">
            <img src={navyPose} alt="Athlete in KORR apparel" className="rounded-lg w-full aspect-[3/4] object-cover object-top" />
            <div className="flex flex-col justify-center">
              <h2 className="font-display text-2xl font-semibold mb-4">Built to Move</h2>
              <p className="text-muted-foreground leading-relaxed">
                We partner with athletes and trainers to develop apparel that performs under pressure. From the gym floor to the tennis court, {SITE_NAME} is designed for those who refuse to settle. Our fabrics are moisture-wicking, breathable, and built to last — because performance shouldn't come with an expiration date.
              </p>
            </div>
          </div>

          {/* Values */}
          <section>
            <h2 className="font-display text-2xl font-semibold mb-8">What We Stand For</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { title: 'Quality', description: 'Premium materials and construction that stand up to any workout.' },
                { title: 'Performance', description: 'Engineered for movement, comfort, and peak athletic output.' },
                { title: 'Community', description: 'Built by athletes, for athletes. We grow stronger together.' },
              ].map((value) => (
                <div key={value.title} className="text-center">
                  <h3 className="font-display text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </MainLayout>
  );
}
