import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/auth'
import { PricingCard } from "../ui/pricing-card"

function PricingPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleCTAClick = (tier: string) => {
    if (!user) {
      navigate('/auth')
    } else {
      if (tier === 'Enterprise') {
        navigate('/contact')
      } else {
        navigate('/checkout')
      }
    }
  }

  return (
    <motion.section 
      className="relative overflow-hidden bg-dark-950 text-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 md:px-8">
        <motion.div 
          className="mb-12 space-y-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <motion.h2 
            className="text-center text-3xl font-semibold leading-tight sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight text-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Choose Your Plan
          </motion.h2>
          <motion.p 
            className="text-center text-base text-gray-400 md:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            Start with our free tier and scale as your business grows. 
            Get the tools you need to manage costs, inventory, and pricing.
          </motion.p>
        </motion.div>
        <motion.div 
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          >
            <PricingCard
              tier="Starter"
              price="Free"
              bestFor="Perfect for small businesses"
              CTA="Get Started Free"
              benefits={[
                { text: "Up to 5 products", checked: true },
                { text: "Basic inventory tracking", checked: true },
                { text: "Cost calculations", checked: true },
                { text: "Email support", checked: true },
                { text: "Advanced analytics", checked: false },
                { text: "AI business insights", checked: false },
                { text: "Custom categories", checked: false },
                { text: "Priority support", checked: false }
              ]}
              onCTAClick={() => handleCTAClick('Starter')}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          >
            <PricingCard
              tier="Professional"
              price="$29/mo"
              bestFor="Best for growing businesses"
              CTA="Start Free Trial"
              featured={true}
              benefits={[
                { text: "Unlimited products", checked: true },
                { text: "Advanced inventory management", checked: true },
                { text: "Smart pricing calculator", checked: true },
                { text: "Email support", checked: true },
                { text: "Advanced analytics", checked: true },
                { text: "AI business insights", checked: true },
                { text: "Custom categories & suppliers", checked: true },
                { text: "Priority support", checked: false }
              ]}
              onCTAClick={() => handleCTAClick('Professional')}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          >
            <PricingCard
              tier="Enterprise"
              price="$99/mo"
              bestFor="For established businesses"
              CTA="Contact Sales"
              benefits={[
                { text: "Everything in Professional", checked: true },
                { text: "Multi-location support", checked: true },
                { text: "Team collaboration", checked: true },
                { text: "API access", checked: true },
                { text: "Custom integrations", checked: true },
                { text: "Advanced reporting", checked: true },
                { text: "Custom categories & suppliers", checked: true },
                { text: "Priority support", checked: true }
              ]}
              onCTAClick={() => handleCTAClick('Enterprise')}
            />
          </motion.div>
        </motion.div>
        
        {/* FAQ Section */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          <motion.h3 
            className="text-center text-2xl font-semibold text-gray-100 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
          >
            Frequently Asked Questions
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                question: "Can I change plans anytime?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                question: "Is there a free trial?",
                answer: "Yes, all paid plans come with a 14-day free trial. No credit card required."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans."
              },
              {
                question: "Do you offer discounts for annual billing?",
                answer: "Yes, save 20% when you pay annually. Contact us for custom enterprise pricing."
              }
            ].map((faq, index) => (
              <motion.div 
                key={faq.question}
                className="bg-dark-900 rounded-lg p-6 border border-dark-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 1.0 + index * 0.1, 
                  ease: "easeOut" 
                }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <h4 className="font-semibold text-gray-100 mb-2">{faq.question}</h4>
                <p className="text-gray-400 text-sm">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export { PricingPage }