import { supabase } from '../lib/supabase'

interface User {
  id: string
}

export class AIPrivacyValidator {
  /**
   * Validates that a conversation belongs to the specified user
   */
  static async validateConversationOwnership(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        console.warn(`Privacy validation failed for conversation ${conversationId}:`, error)
        return false
      }

      return data.user_id === userId
    } catch (error) {
      console.error('Error validating conversation ownership:', error)
      return false
    }
  }

  /**
   * Validates that a user can access a specific message
   */
  static async validateMessageAccess(messageId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select(`
          conversation_id,
          ai_conversations!inner(user_id)
        `)
        .eq('id', messageId)
        .single()

      if (error || !data) {
        console.warn(`Privacy validation failed for message ${messageId}:`, error)
        return false
      }

      // TypeScript may not recognize the joined table structure
      const conversation = data.ai_conversations as any
      return Array.isArray(conversation) 
        ? conversation[0]?.user_id === userId 
        : conversation?.user_id === userId
    } catch (error) {
      console.error('Error validating message access:', error)
      return false
    }
  }

  /**
   * Sanitizes conversation data by ensuring user can only see their own conversations
   */
  static sanitizeConversations<T extends { user_id: string }>(conversations: T[], userId: string): T[] {
    return conversations.filter(conv => conv.user_id === userId)
  }

  /**
   * Sanitizes message data by ensuring they belong to user's conversations
   */
  static async sanitizeMessages<T extends { conversation_id: string }>(messages: T[], userId: string): Promise<T[]> {
    if (messages.length === 0) return messages

    // Get unique conversation IDs
    const conversationIds = [...new Set(messages.map(msg => msg.conversation_id))]
    
    // Validate each conversation belongs to the user
    const validConversationIds = new Set<string>()
    
    for (const convId of conversationIds) {
      if (await this.validateConversationOwnership(convId, userId)) {
        validConversationIds.add(convId)
      }
    }

    // Filter messages to only include those from valid conversations
    return messages.filter(msg => validConversationIds.has(msg.conversation_id))
  }

  /**
   * Checks if user is authenticated and returns user info
   */
  static async validateAuthentication(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.warn('Authentication validation failed:', error)
        return null
      }

      return { id: user.id }
    } catch (error) {
      console.error('Error validating authentication:', error)
      return null
    }
  }

  /**
   * Comprehensive privacy check for AI chat operations
   */
  static async performPrivacyAudit(userId: string): Promise<{
    isValid: boolean
    issues: string[]
    summary: {
      conversationCount: number
      messageCount: number
      orphanedMessages: number
    }
  }> {
    const issues: string[] = []
    let conversationCount = 0
    let messageCount = 0
    let orphanedMessages = 0

    try {
      // Check conversations
      const { data: conversations, error: convError } = await supabase
        .from('ai_conversations')
        .select('id, user_id')
        .eq('user_id', userId)

      if (convError) {
        issues.push(`Error fetching conversations: ${convError.message}`)
      } else {
        conversationCount = conversations?.length || 0
        
        // Validate each conversation
        for (const conv of conversations || []) {
          if (conv.user_id !== userId) {
            issues.push(`Conversation ${conv.id} has incorrect user_id`)
          }
        }
      }

      // Check messages
      const { data: messages, error: msgError } = await supabase
        .from('ai_messages')
        .select(`
          id,
          conversation_id,
          ai_conversations!inner(user_id)
        `)

      if (msgError) {
        issues.push(`Error fetching messages: ${msgError.message}`)
      } else {
        messageCount = messages?.length || 0
        
        // Validate each message belongs to user's conversations
        for (const msg of messages || []) {
          const conversation = msg.ai_conversations as any
          const convUserId = Array.isArray(conversation) 
            ? conversation[0]?.user_id 
            : conversation?.user_id
            
          if (convUserId !== userId) {
            orphanedMessages++
            issues.push(`Message ${msg.id} belongs to unauthorized conversation`)
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        summary: {
          conversationCount,
          messageCount,
          orphanedMessages
        }
      }
    } catch (error) {
      issues.push(`Privacy audit failed: ${error}`)
      return {
        isValid: false,
        issues,
        summary: {
          conversationCount: 0,
          messageCount: 0,
          orphanedMessages: 0
        }
      }
    }
  }

  /**
   * Clean up any privacy violations (should only be used by system admin)
   */
  static async cleanupPrivacyViolations(userId: string): Promise<{
    cleaned: boolean
    removed: {
      conversations: number
      messages: number
    }
  }> {
    let removedConversations = 0
    let removedMessages = 0

    try {
      // Remove conversations that don't belong to the user (shouldn't happen with RLS)
      const { data: wrongConversations } = await supabase
        .from('ai_conversations')
        .select('id')
        .neq('user_id', userId)

      if (wrongConversations && wrongConversations.length > 0) {
        const { error } = await supabase
          .from('ai_conversations')
          .delete()
          .neq('user_id', userId)
          
        if (!error) {
          removedConversations = wrongConversations.length
        }
      }

      // Remove orphaned messages (shouldn't happen with RLS and FK constraints)
      const { data: orphanedMsgs } = await supabase
        .from('ai_messages')
        .select(`
          id,
          ai_conversations!inner(user_id)
        `)

      const msgsToRemove = orphanedMsgs?.filter(msg => {
        const conversation = msg.ai_conversations as any
        const convUserId = Array.isArray(conversation) 
          ? conversation[0]?.user_id 
          : conversation?.user_id
        return convUserId !== userId
      }) || []

      if (msgsToRemove.length > 0) {
        const msgIds = msgsToRemove.map(msg => msg.id)
        const { error } = await supabase
          .from('ai_messages')
          .delete()
          .in('id', msgIds)
          
        if (!error) {
          removedMessages = msgsToRemove.length
        }
      }

      return {
        cleaned: true,
        removed: {
          conversations: removedConversations,
          messages: removedMessages
        }
      }
    } catch (error) {
      console.error('Error cleaning up privacy violations:', error)
      return {
        cleaned: false,
        removed: {
          conversations: 0,
          messages: 0
        }
      }
    }
  }
}

export default AIPrivacyValidator 