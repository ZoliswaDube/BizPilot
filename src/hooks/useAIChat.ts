import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useUserSettings } from './useUserSettings'
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
  const { user } = useAuth()
  const { settings } = useUserSettings()
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id)
    }
  }, [currentConversation])

  const fetchConversations = async () => {
    if (!user) return

    try {
      setError(null)
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
      
      // If no current conversation, create a new one
      if (!currentConversation && data && data.length === 0) {
        await createNewConversation()
      } else if (!currentConversation && data && data.length > 0) {
        setCurrentConversation(data[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations')
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    }
  }

  const createNewConversation = async (title?: string) => {
    if (!user) return null

    try {
      setError(null)
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: title || 'New Conversation'
        })
        .select()
        .single()

      if (error) throw error
      
      setConversations(prev => [data, ...prev])
      setCurrentConversation(data)
      
      // Add welcome message
      await addMessage(data.id, 
        "Hello! I'm your AI business assistant. I can help you with pricing strategies, cost analysis, inventory management, and business insights based on your actual business data. What would you like to know?", 
        false
      )
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation')
      return null
    }
  }

  const addMessage = async (conversationId: string, content: string, isUser: boolean) => {
    try {
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

      if (error) throw error
      
      setMessages(prev => [...prev, data])
      
      // Update conversation's updated_at timestamp
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message')
      return null
    }
  }

  const getBusinessContext = async (): Promise<BusinessContext> => {
    if (!user) {
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
      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('profit_margin')
        .eq('user_id', user.id)

      // Fetch inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('current_quantity, low_stock_alert')
        .eq('user_id', user.id)

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
        businessName: settings?.business_name || '',
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
    if (!currentConversation || !user) return

    setLoading(true)
    
    try {
      // Add user message
      await addMessage(currentConversation.id, content, true)
      
      // Simulate AI response (replace with real OpenAI API call)
      const aiResponse = await generateAIResponse()
      
      // Add AI response
      await addMessage(currentConversation.id, aiResponse, false)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const generateAIResponse = async (): Promise<string> => {
    // TODO: Replace with actual OpenAI API integration
    // This function should:
    // 1. Send userMessage and context to OpenAI API
    // 2. Include business context in the prompt for personalized responses
    // 3. Handle API errors gracefully
    // 4. Return AI-generated response based on user's real business data
    
    // Temporary placeholder response until AI integration is complete
    return `I'm your AI business assistant and I'd be happy to help you with insights about your business. However, the AI integration is currently being set up. Please check back soon for personalized business insights based on your actual data.`
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)

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
      setError(err instanceof Error ? err.message : 'Failed to delete conversation')
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