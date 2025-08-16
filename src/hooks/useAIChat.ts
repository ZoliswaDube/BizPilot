import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { useUserSettings } from './useUserSettings'
import { sendToGroq, generateConversationTitle } from '../services/deepseekApi'
import { Database } from '../lib/supabase'

type AIConversation = Database['public']['Tables']['ai_conversations']['Row']
type AIMessage = Database['public']['Tables']['ai_messages']['Row']

interface BusinessContext {
  totalProducts: number
  totalInventoryItems: number
  lowStockItems: number
  avgMargin: number
  businessName: string
  hourlyRate: number
}

export function useAIChat() {
  const { user } = useAuthStore()
  const { settings } = useUserSettings()
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchConversations()
    } else {
      // Clear data when user logs out
      setConversations([])
      setCurrentConversation(null)
      setMessages([])
      setError(null)
    }
  }, [user])

  useEffect(() => {
    if (currentConversation && user) {
      fetchMessages(currentConversation.id)
    } else {
      setMessages([])
    }
  }, [currentConversation, user])

  // Enhanced privacy validation
  const validateUserAccess = () => {
    if (!user) {
      throw new Error('User must be authenticated to access AI chat')
    }
    return true
  }

  const fetchConversations = async () => {
    try {
      validateUserAccess()
      setError(null)
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user!.id) // Double validation
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Fetch conversations error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      // Additional client-side validation
      const validatedData = (data || []).filter(conv => conv.user_id === user!.id)
      setConversations(validatedData)
      
      // If no current conversation, create a new one
      if (!currentConversation && validatedData.length === 0) {
        await createNewConversation()
      } else if (!currentConversation && validatedData.length > 0) {
        setCurrentConversation(validatedData[0])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations'
      setError(errorMessage)
      console.error('Privacy Error - Fetch Conversations:', err)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      validateUserAccess()
      setError(null)
      
      // First validate the conversation belongs to the user
      const { data: conversationCheck, error: convError } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .eq('user_id', user!.id)
        .single()

      if (convError || !conversationCheck) {
        throw new Error('Access denied: Conversation not found or access unauthorized')
      }

      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Fetch messages error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      setMessages(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages'
      setError(errorMessage)
      console.error('Privacy Error - Fetch Messages:', err)
    }
  }

  const createNewConversation = async (title?: string) => {
    try {
      validateUserAccess()
      setError(null)
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user!.id,
          title: title || 'New Conversation'
        })
        .select()
        .single()

      if (error) {
        console.error('Create conversation error:', error)
        throw new Error(`Failed to create conversation: ${error.message}`)
      }
      
      // Additional validation - ensure the returned data belongs to current user
      if (data.user_id !== user!.id) {
        throw new Error('Privacy violation: Created conversation user_id mismatch')
      }
      
      setConversations(prev => [data, ...prev])
      setCurrentConversation(data)
      
      // Add welcome message
      await addMessage(data.id, 
        "Hello! I'm your AI business assistant. I can help you with pricing strategies, cost analysis, inventory management, and business insights based on your actual business data. What would you like to know?", 
        false
      )
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation'
      setError(errorMessage)
      console.error('Privacy Error - Create Conversation:', err)
      return null
    }
  }

  const addMessage = async (conversationId: string, content: string, isUser: boolean) => {
    try {
      validateUserAccess()
      
      // Validate conversation ownership before adding message
      const { data: conversationCheck, error: convError } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .eq('user_id', user!.id)
        .single()

      if (convError || !conversationCheck) {
        throw new Error('Access denied: Cannot add message to unauthorized conversation')
      }

      setError(null)
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          content,
          is_user: isUser
        })
        .select()
        .single()

      if (error) {
        console.error('Add message error:', error)
        throw new Error(`Failed to add message: ${error.message}`)
      }
      
      setMessages(prev => [...prev, data])
      
      // Update conversation's updated_at timestamp
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', user!.id) // Additional security check
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message'
      setError(errorMessage)
      console.error('Privacy Error - Add Message:', err)
      return null
    }
  }

  const getBusinessContext = async (): Promise<BusinessContext> => {
    try {
      validateUserAccess()
    } catch {
      return {
        totalProducts: 0,
        totalInventoryItems: 0,
        lowStockItems: 0,
        avgMargin: 0,
        businessName: '',
        hourlyRate: 15
      }
    }

    try {
      // Get user's business first with additional security check
      const { data: businessUser } = await supabase
        .from('business_users')
        .select(`
          business:businesses(id, name)
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single()

      const business = Array.isArray(businessUser?.business) ? businessUser?.business[0] : businessUser?.business
      const businessId = business?.id
      const businessName = business?.name || ''

      if (!businessId) {
        return {
          totalProducts: 0,
          totalInventoryItems: 0,
          lowStockItems: 0,
          avgMargin: 0,
          businessName: '',
          hourlyRate: settings?.hourly_rate || 15
        }
      }

      // Fetch products by business_id with user validation
      const { data: products } = await supabase
        .from('products')
        .select('profit_margin')
        .eq('business_id', businessId)

      // Fetch inventory by business_id with user validation
      const { data: inventory } = await supabase
        .from('inventory')
        .select('current_quantity, low_stock_alert')
        .eq('business_id', businessId)

      const totalProducts = products?.length || 0
      const totalInventoryItems = inventory?.length || 0
      const lowStockItems = inventory?.filter(item => 
        item.current_quantity <= (item.low_stock_alert || 0)
      ).length || 0
      
      const avgMargin = totalProducts > 0 
        ? (products || []).reduce((sum, p) => sum + (p.profit_margin || 0), 0) / totalProducts
        : 0

      return {
        totalProducts,
        totalInventoryItems,
        lowStockItems,
        avgMargin,
        businessName,
        hourlyRate: settings?.hourly_rate || 15
      }
    } catch (err) {
      console.error('Error fetching business context:', err)
      return {
        totalProducts: 0,
        totalInventoryItems: 0,
        lowStockItems: 0,
        avgMargin: 0,
        businessName: settings?.business_name || '',
        hourlyRate: settings?.hourly_rate || 15
      }
    }
  }

  const sendMessage = async (content: string) => {
    try {
      validateUserAccess()
      
      if (!currentConversation) {
        throw new Error('No active conversation')
      }

      // Additional validation that current conversation belongs to user
      if (currentConversation.user_id !== user!.id) {
        throw new Error('Privacy violation: Current conversation does not belong to user')
      }

      setLoading(true)
      
      // Add user message to UI immediately
      await addMessage(currentConversation.id, content, true)
      
      // Get latest business context
      const context = await getBusinessContext()
      
      // Build conversation history for better AI memory
      const conversationHistory = messages.map(msg => ({
        role: msg.is_user ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
      
      // Call Groq API with conversation history
      const aiResponse = await sendToGroq(content, context, conversationHistory)
      
      // Add AI response to conversation
      await addMessage(currentConversation.id, aiResponse, false)
      
      // Update conversation title if first message
      if (messages.length === 0) {
        const title = await generateConversationTitle(content)
        await updateConversationTitle(currentConversation.id, title)
      }
      
    } catch (err) {
      console.error('Error sending message:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      
      if (currentConversation) {
        await addMessage(currentConversation.id, `Sorry, I encountered an error: ${errorMessage}. Please try again.`, false)
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      validateUserAccess()
      
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', user!.id) // Additional security check

      if (error) throw error
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, title } : conv
        )
      )
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, title } : null)
      }
    } catch (err) {
      console.error('Error updating conversation title:', err)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      validateUserAccess()
      setError(null)
      
      // Additional validation - ensure conversation belongs to user
      const { data: conversationCheck, error: convError } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .eq('user_id', user!.id)
        .single()

      if (convError || !conversationCheck) {
        throw new Error('Access denied: Cannot delete unauthorized conversation')
      }
      
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user!.id) // Double security check

      if (error) throw error
      
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (currentConversation?.id === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId)
        setCurrentConversation(remaining.length > 0 ? remaining[0] : null)
        setMessages([])
        
        if (remaining.length === 0) {
          await createNewConversation()
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation'
      setError(errorMessage)
      console.error('Privacy Error - Delete Conversation:', err)
    }
  }

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    createNewConversation,
    sendMessage,
    deleteConversation,
    setCurrentConversation,
    getBusinessContext
  }
}