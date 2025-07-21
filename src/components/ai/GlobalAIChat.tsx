import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react'
import { useAIChat } from '../../hooks/useAIChat'
import { useLocation } from 'react-router-dom'
import { markdownToPlainText } from '../../utils/markdown'

export const GlobalAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  
  const { 
    messages, 
    loading, 
    sendMessage, 
    currentConversation,
    createNewConversation 
  } = useAIChat()

  // Don't show on /ai page
  if (location.pathname === '/ai') {
    return null
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return
    
    // Create conversation if none exists
    if (!currentConversation) {
      await createNewConversation()
    }
    
    await sendMessage(message.trim())
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200 md:bottom-8 md:right-8"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed z-50 bg-dark-900 rounded-lg shadow-2xl border border-dark-700 ${
              isMinimized 
                ? 'bottom-6 right-6 w-80 h-16 md:bottom-8 md:right-8' 
                : 'bottom-6 right-6 w-80 h-96 md:bottom-8 md:right-8 md:w-96 md:h-[500px]'
            } transition-all duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-800 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <MessageCircle size={20} className="text-primary-400" />
                <h3 className="font-semibold text-gray-100">AI Assistant</h3>
              </div>
              <div className="flex items-center space-x-2">
                {!isMinimized && (
                  <button
                    onClick={async () => {
                      await createNewConversation()
                      setMessage('')
                    }}
                    className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    title="Start new conversation"
                  >
                    New
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-dark-700 rounded transition-colors text-gray-400 hover:text-gray-200"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-dark-700 rounded transition-colors text-gray-400 hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 h-64 md:h-80">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                      <MessageCircle size={32} className="mx-auto mb-2 opacity-50 text-gray-500" />
                      <p className="text-sm">Ask me anything about your business!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            msg.is_user
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-dark-800 text-gray-100 border border-dark-600 rounded-bl-sm'
                          }`}
                        >
                          {markdownToPlainText(msg.content)}
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-dark-800 border border-dark-600 p-3 rounded-lg rounded-bl-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-dark-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about your business..."
                      className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-100 placeholder-gray-400"
                      disabled={loading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || loading}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
