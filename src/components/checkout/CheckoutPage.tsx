import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { CreditCard, ArrowLeft, Shield, DollarSign } from 'lucide-react'

export function CheckoutPage() {
  const handlePayment = () => {
    // TODO: Integrate with payment processor (e.g., Stripe)
    // Handle subscription creation and payment processing here
    console.log('Payment processing would be handled here')
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center space-x-4">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            to="/pricing"
            className="p-2 text-gray-400 hover:text-gray-300 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-bold text-gray-100">Checkout</h1>
          <p className="text-gray-400">Complete your subscription</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Summary */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <div className="flex items-center mb-4">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <DollarSign className="h-5 w-5 text-primary-400 mr-2" />
            </motion.div>
            <h2 className="text-lg font-semibold text-gray-100">Plan Summary</h2>
          </div>
          
          <div className="space-y-4">
            <motion.div 
              className="p-4 bg-dark-800 rounded-lg border border-dark-600"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-100">Selected Plan</span>
                <span className="text-primary-400 font-bold">$XX/mo</span>
              </div>
              <p className="text-sm text-gray-400">Your chosen subscription plan</p>
            </motion.div>
            
            <div className="space-y-2 text-sm text-gray-300">
              {[
                'Unlimited products',
                'Advanced inventory management',
                'AI business insights',
                '14-day free trial'
              ].map((feature, index) => (
                <motion.div 
                  key={feature}
                  className="flex items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.3 + index * 0.05, 
                    ease: "easeOut" 
                  }}
                >
                  <motion.span 
                    className="w-2 h-2 bg-primary-500 rounded-full mr-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      duration: 0.2, 
                      delay: 0.4 + index * 0.05,
                      type: "spring",
                      stiffness: 400
                    }}
                  ></motion.span>
                  {feature}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Payment Form */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center mb-4">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <CreditCard className="h-5 w-5 text-primary-400 mr-2" />
            </motion.div>
            <h2 className="text-lg font-semibold text-gray-100">Payment Method</h2>
          </div>
          
          <div className="space-y-4">
            <motion.div 
              className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
            >
              <div className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Shield className="h-4 w-4 text-blue-400 mr-2" />
                </motion.div>
                <span className="text-sm text-blue-300">
                  14-day free trial - No charge until trial ends
                </span>
              </div>
            </motion.div>
            
            <form className="space-y-4">
              {[
                { label: 'Card Number', placeholder: 'Card Number' },
                { label: 'Expiry Date', placeholder: 'MM/YY', type: 'half' },
                { label: 'CVV', placeholder: '123', type: 'half' },
                { label: 'Billing Address', placeholder: 'Enter your billing address' }
              ].map((field, index) => (
                <motion.div
                  key={field.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.5 + index * 0.05, 
                    ease: "easeOut" 
                  }}
                  className={field.type === 'half' ? 'grid grid-cols-2 gap-4' : ''}
                >
                  {field.type === 'half' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="input-field"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="input-field"
                          disabled
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        className="input-field"
                        disabled
                      />
                    </>
                  )}
                </motion.div>
              ))}
            </form>
            
            <motion.div 
              className="pt-4 border-t border-dark-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8, ease: "easeOut" }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button onClick={handlePayment} className="w-full">
                  Start Free Trial
                </Button>
              </motion.div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Your trial starts today. Billing begins after the trial period.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Security Notice */}
      <motion.div 
        className="card bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Shield className="h-5 w-5 text-green-400 mr-3" />
          </motion.div>
          <div>
            <h3 className="font-medium text-green-300">Secure Payment</h3>
            <p className="text-green-200 text-sm mt-1">
              Your payment information is encrypted and secure. Cancel anytime during your trial.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}