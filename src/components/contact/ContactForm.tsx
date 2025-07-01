import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { Send, ArrowLeft, Building, Mail, Phone, MessageSquare } from 'lucide-react'

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission logic
    // Send form data to backend API or email service
    console.log('Contact form submission would be handled here')
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
          <h1 className="text-2xl font-bold text-gray-100">Contact Sales</h1>
          <p className="text-gray-400">Get in touch with our enterprise team</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Form */}
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
              <MessageSquare className="h-5 w-5 text-primary-400 mr-2" />
            </motion.div>
            <h2 className="text-lg font-semibold text-gray-100">Send us a message</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'name', label: 'Full Name *', placeholder: 'Your Full Name', required: true },
                { name: 'email', label: 'Email Address *', placeholder: 'your.email@company.com', type: 'email', required: true }
              ].map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.3 + index * 0.05, 
                    ease: "easeOut" 
                  }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {field.label}
                  </label>
                  <motion.input
                    type={field.type || 'text'}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder={field.placeholder}
                    required={field.required}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </motion.div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'company', label: 'Company Name', placeholder: 'Your Company Name' },
                { name: 'phone', label: 'Phone Number', placeholder: 'Your Phone Number', type: 'tel' }
              ].map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.4 + index * 0.05, 
                    ease: "easeOut" 
                  }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {field.label}
                  </label>
                  <motion.input
                    type={field.type || 'text'}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder={field.placeholder}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-1">
                How can we help you? *
              </label>
              <motion.textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="input-field"
                placeholder="Tell us about your business needs and requirements..."
                required
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button type="submit" className="w-full flex items-center justify-center">
                <motion.div
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Send className="h-4 w-4 mr-2" />
                </motion.div>
                Send Message
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Contact Information */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <motion.div 
            className="card"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <h3 className="font-semibold text-gray-100 mb-4">Enterprise Features</h3>
            <div className="space-y-3 text-sm text-gray-300">
              {[
                'Multi-location support for franchises',
                'Team collaboration and user management',
                'Custom integrations and API access',
                'Advanced reporting and analytics',
                'Dedicated customer success manager',
                'Priority support and training'
              ].map((feature, index) => (
                <motion.div 
                  key={feature}
                  className="flex items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.4 + index * 0.05, 
                    ease: "easeOut" 
                  }}
                >
                  <motion.span 
                    className="w-2 h-2 bg-primary-500 rounded-full mr-3"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      duration: 0.2, 
                      delay: 0.5 + index * 0.05,
                      type: "spring",
                      stiffness: 400
                    }}
                  ></motion.span>
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="card"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <h3 className="font-semibold text-gray-100 mb-4">Get in Touch</h3>
            <div className="space-y-4">
              {[
                { icon: Mail, title: 'Email', subtitle: 'Contact us via email' },
                { icon: Phone, title: 'Phone', subtitle: 'Call us for support' },
                { icon: Building, title: 'Schedule a Demo', subtitle: 'Book a personalized demonstration' }
              ].map((contact, index) => (
                <motion.div 
                  key={contact.title}
                  className="flex items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.6 + index * 0.1, 
                    ease: "easeOut" 
                  }}
                  whileHover={{ x: 5 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <contact.icon className="h-4 w-4 text-primary-400 mr-3" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-gray-100">{contact.title}</p>
                    <p className="text-sm text-gray-400">{contact.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="card bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <h3 className="font-semibold text-blue-300 mb-2">Response Time</h3>
            <p className="text-blue-200 text-sm">
              Our enterprise sales team typically responds within 24 hours during business days.
              For urgent inquiries, please call us directly.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}