import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '../common/Logo'
import { AuroraHero } from '../ui/futuristic-hero-section'
import { 
  BarChart3, 
  Package, 
  Warehouse, 
  MessageSquare, 
  QrCode, 
  ArrowRight,
  CheckCircle,
  Shield,
  TrendingUp
} from 'lucide-react'

export function HomePage() {
  const [badgeAnimated, setBadgeAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setBadgeAnimated(true)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: Package,
      title: 'Product Management',
      description: 'Add products with ingredients and auto-calculate costs'
    },
    {
      icon: BarChart3,
      title: 'Smart Pricing',
      description: 'Get optimal pricing with profit margin calculations'
    },
    {
      icon: Warehouse,
      title: 'Inventory Tracking',
      description: 'Track stock levels with low inventory alerts'
    },
    {
      icon: MessageSquare,
      title: 'AI Business Assistant',
      description: 'Get insights and answers about your business'
    },
    {
      icon: QrCode,
      title: 'QR Tip Generator',
      description: 'Create QR codes for digital tip collection'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your business data is protected and secure'
    }
  ]

  const benefits = [
    'Save hours on cost calculations',
    'Optimize your pricing strategy',
    'Never run out of stock again',
    'Make data-driven decisions',
    'Increase profit margins'
  ]

  return (
    <div className="bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Navigation */}
      <nav className="relative z-50 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo width={32} height={32} className="shadow-lg" />
              <span className="ml-2 text-xl font-bold text-gray-100">BizPilot</span>
            </div>
            <div className="flex space-x-4">
              <Link 
                to="/auth" 
                className="btn-secondary text-sm"
              >
                Sign In
              </Link>
              <Link 
                to="/pricing" 
                className="btn-secondary text-sm"
              >
                Pricing
              </Link>
              <Link 
                to="/auth" 
                className="btn-primary text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Futuristic Aurora Hero */}
      <div className="relative">
        {/* Custom Badge - Positioned over hero */}
        <div className="absolute top-4 right-4 z-40">
        <a 
          href="https://bolt.new/?rid=os72mi" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block transition-all duration-300 hover:shadow-2xl"
        >
          <img 
            src="https://storage.bolt.army/white_circle_360x360.png" 
            alt="Built with Bolt.new badge" 
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg transition-all duration-300 ${
              badgeAnimated 
                ? 'hover:scale-110 hover:rotate-12' 
                : 'animate-[badgeIntro_0.8s_ease-out_1s_both]'
            }`}
            style={{
              animation: badgeAnimated ? 'none' : undefined
            }}
            onAnimationEnd={() => setBadgeAnimated(true)}
          />
        </a>
        </div>
        <AuroraHero />
      </div>

      {/* Features Section */}
      <div className="py-20 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From cost calculations to AI insights, BizPilot gives you the tools to make smart business decisions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="bg-dark-800 rounded-xl p-6 hover:bg-dark-700 transition-all duration-300 border border-dark-600 hover:border-primary-600/30 hover:shadow-lg hover:shadow-primary-500/10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600/20 to-accent-600/20 rounded-lg flex items-center justify-center mb-4 border border-primary-500/30">
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <feature.icon className="h-6 w-6 text-primary-400" />
                  </motion.div>
                </div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gradient-to-br from-dark-900 to-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-6">
                Stop Guessing, Start Growing
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Make informed decisions with real-time cost tracking, intelligent pricing, 
                and AI-powered business insights that help you maximize profits.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    </motion.div>
                    <span className="text-gray-200">{benefit}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link 
                  to="/auth" 
                  className="btn-primary group mt-8 inline-flex items-center"
                >
                  Get Started Now
                  <motion.div
                    className="ml-2"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </Link>
              </motion.div>
            </div>
            
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6,
                ease: "easeOut"
              }}
            >
              <div className="bg-dark-800 rounded-2xl shadow-2xl p-8 border border-dark-600">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-100">Profit Analysis</h3>
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </motion.div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Product Cost:', value: '$XX.XX' },
                    { label: 'Selling Price:', value: '$XX.XX' },
                    { label: 'Profit Margin:', value: 'XX%', highlight: true }
                  ].map((item, index) => (
                    <motion.div 
                      key={item.label}
                      className={`flex justify-between ${item.highlight ? 'border-t border-dark-600 pt-2' : ''}`}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <span className="text-gray-400">{item.label}</span>
                      <motion.span 
                        className={`font-semibold ${item.highlight ? 'text-green-400' : 'text-gray-100'}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {item.value}
                      </motion.span>
                    </motion.div>
                  ))}
                  
                  <motion.div 
                    className="bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg p-3 mt-4 border border-green-700/30"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.4,
                      ease: "easeOut"
                    }}
                  >
                    <p className="text-sm text-green-300">
                      💡 AI insights help optimize your pricing strategy based on real market data
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-dark-950 to-dark-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Ready to Transform Your Business?
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-400 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Join thousands of small business owners who are making smarter decisions with BizPilot.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to="/auth" 
              className="btn-primary group text-lg px-8 py-4 inline-flex items-center"
            >
              Start Your Free Trial
              <motion.div
                className="ml-2"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </Link>
          </motion.div>
          <motion.p 
            className="text-gray-500 mt-4 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-dark-700 py-8">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.div 
              className="flex items-center mb-4 md:mb-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Logo width={24} height={24} className="shadow-lg" />
              <span className="ml-2 font-semibold text-gray-100">BizPilot</span>
            </motion.div>
            <p className="text-gray-400 text-sm">
              © 2025 BizPilot. Built with ❤️ for small businesses.
            </p>
          </div>
        </motion.div>
      </footer>

    </div>
  )
}