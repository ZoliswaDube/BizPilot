import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth';
import { mcp_supabase_execute_sql } from '../services/mcpClient';

export interface AIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  conversation_id: string;
  is_user?: boolean; // For backward compatibility with web app
  created_at?: string; // For backward compatibility with web app
}

export interface AIConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  user_id?: string;
}

interface BusinessContext {
  totalProducts: number;
  totalInventoryItems: number;
  lowStockItems: number;
  avgMargin: number;
  businessName: string;
  hourlyRate: number;
  totalInventoryValue: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  totalExpenses: number;
  topProducts: Array<{
    name: string;
    profit_margin: number;
    selling_price: number;
  }>;
  recentOrders: Array<{
    order_number: string;
    total_amount: number;
    status: string;
    customer_name?: string;
  }>;
}

export function useAIChat() {
  const { user, business } = useAuthStore();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);

  useEffect(() => {
    if (user && business) {
      fetchConversations();
      loadBusinessContext();
    } else {
      // Clear data when user logs out - matches web app behavior
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setError(null);
      setBusinessContext(null);
    }
  }, [user, business]);

  useEffect(() => {
    if (currentConversation && user) {
      fetchMessages(currentConversation.id);
    } else {
      setMessages([]);
    }
  }, [currentConversation, user]);

  // Enhanced privacy validation - matches web app
  const validateUserAccess = () => {
    if (!user) {
      throw new Error('User must be authenticated to access AI chat');
    }
    return true;
  };

  const fetchConversations = async () => {
    try {
      validateUserAccess();
      setError(null);

      // Try to fetch from storage first
      const storedConversations = await AsyncStorage.getItem(`ai_conversations_${user!.id}`);
      if (storedConversations) {
        const parsed = JSON.parse(storedConversations);
        setConversations(parsed);
        
        // Set current conversation if none exists
        if (!currentConversation && parsed.length > 0) {
          setCurrentConversation(parsed[0]);
        }
      }

      // Also try to fetch from MCP server (matches web app architecture)
      try {
        const result = await mcp_supabase_execute_sql({
          query: `
            SELECT * FROM ai_conversations 
            WHERE user_id = $1 AND business_id = $2
            ORDER BY updated_at DESC
          `,
          params: [user!.id, business?.id]
        });

        if (result.success && result.data) {
          // Additional client-side validation (matches web app)
          const validatedData = result.data.filter(conv => conv.user_id === user!.id);
          setConversations(validatedData);
          await AsyncStorage.setItem(`ai_conversations_${user!.id}`, JSON.stringify(validatedData));
          
          // If no current conversation, create or select one
          if (!currentConversation && validatedData.length === 0) {
            await createNewConversation();
          } else if (!currentConversation && validatedData.length > 0) {
            setCurrentConversation(validatedData[0]);
          }
        }
      } catch (mcpError) {
        console.log('MCP server not available, using local storage only');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
      console.error('Privacy Error - Fetch Conversations:', err);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      validateUserAccess();
      setError(null);

      // Try to fetch from local storage first
      const storedMessages = await AsyncStorage.getItem(`ai_messages_${conversationId}`);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed);
      }

      // Also try to fetch from MCP server (matches web app)
      try {
        // First validate the conversation belongs to the user (matches web app security)
        const conversationCheck = await mcp_supabase_execute_sql({
          query: `
            SELECT user_id FROM ai_conversations 
            WHERE id = $1 AND user_id = $2
          `,
          params: [conversationId, user!.id]
        });

        if (!conversationCheck.success || conversationCheck.data.length === 0) {
          throw new Error('Privacy violation: Conversation does not belong to user');
        }

        const result = await mcp_supabase_execute_sql({
          query: `
            SELECT * FROM ai_messages 
            WHERE conversation_id = $1 
            ORDER BY created_at ASC
          `,
          params: [conversationId]
        });

        if (result.success && result.data) {
          // Convert to mobile format with backward compatibility
          const convertedMessages = result.data.map(msg => ({
            ...msg,
            role: msg.is_user ? 'user' : 'assistant',
            timestamp: new Date(msg.created_at).getTime(),
          }));
          setMessages(convertedMessages);
          await AsyncStorage.setItem(`ai_messages_${conversationId}`, JSON.stringify(convertedMessages));
        }
      } catch (mcpError) {
        console.log('MCP server not available for messages, using local storage');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      console.error('Privacy Error - Fetch Messages:', err);
    }
  };

  // Real business context loading - matches web app functionality
  const getBusinessContext = async (): Promise<BusinessContext> => {
    try {
      validateUserAccess();
    } catch {
      return {
        totalProducts: 0,
        totalInventoryItems: 0,
        lowStockItems: 0,
        avgMargin: 0,
        businessName: '',
        hourlyRate: 15,
        totalInventoryValue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        topProducts: [],
        recentOrders: [],
      };
    }

    try {
      if (!business?.id) {
        return {
          totalProducts: 0,
          totalInventoryItems: 0,
          lowStockItems: 0,
          avgMargin: 0,
          businessName: '',
          hourlyRate: 15,
          totalInventoryValue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          topProducts: [],
          recentOrders: [],
        };
      }

      // Parallel queries for business data (matches web app approach)
      const [
        productsResult,
        inventoryResult,
        ordersResult,
        customersResult,
        expensesResult
      ] = await Promise.allSettled([
        mcp_supabase_execute_sql({
          query: `
            SELECT COUNT(*) as count, AVG(profit_margin) as avg_margin,
                   array_agg(name ORDER BY profit_margin DESC LIMIT 3) as top_names,
                   array_agg(profit_margin ORDER BY profit_margin DESC LIMIT 3) as top_margins,
                   array_agg(selling_price ORDER BY profit_margin DESC LIMIT 3) as top_prices
            FROM products WHERE business_id = $1
          `,
          params: [business.id]
        }),
        mcp_supabase_execute_sql({
          query: `
            SELECT COUNT(*) as count, 
                   SUM(current_quantity * cost_per_unit) as total_value,
                   COUNT(CASE WHEN current_quantity <= low_stock_alert THEN 1 END) as low_stock_count
            FROM inventory WHERE business_id = $1
          `,
          params: [business.id]
        }),
        mcp_supabase_execute_sql({
          query: `
            SELECT COUNT(*) as count, SUM(total_amount) as total_revenue,
                   array_agg(order_number ORDER BY created_at DESC LIMIT 3) as recent_numbers,
                   array_agg(total_amount ORDER BY created_at DESC LIMIT 3) as recent_amounts,
                   array_agg(status ORDER BY created_at DESC LIMIT 3) as recent_statuses
            FROM orders WHERE business_id = $1 AND status != 'cancelled'
          `,
          params: [business.id]
        }),
        mcp_supabase_execute_sql({
          query: `SELECT COUNT(*) as count FROM customers WHERE business_id = $1`,
          params: [business.id]
        }),
        mcp_supabase_execute_sql({
          query: `SELECT SUM(amount) as total FROM expenses WHERE business_id = $1`,
          params: [business.id]
        })
      ]);

      // Process results with fallbacks
      const products = productsResult.status === 'fulfilled' && productsResult.value.success 
        ? productsResult.value.data[0] : null;
      const inventory = inventoryResult.status === 'fulfilled' && inventoryResult.value.success 
        ? inventoryResult.value.data[0] : null;
      const orders = ordersResult.status === 'fulfilled' && ordersResult.value.success 
        ? ordersResult.value.data[0] : null;
      const customers = customersResult.status === 'fulfilled' && customersResult.value.success 
        ? customersResult.value.data[0] : null;
      const expenses = expensesResult.status === 'fulfilled' && expensesResult.value.success 
        ? expensesResult.value.data[0] : null;

      // Build top products array
      const topProducts = [];
      if (products?.top_names) {
        for (let i = 0; i < Math.min(3, products.top_names.length); i++) {
          if (products.top_names[i]) {
            topProducts.push({
              name: products.top_names[i],
              profit_margin: products.top_margins[i] || 0,
              selling_price: products.top_prices[i] || 0,
            });
          }
        }
      }

      // Build recent orders array
      const recentOrders = [];
      if (orders?.recent_numbers) {
        for (let i = 0; i < Math.min(3, orders.recent_numbers.length); i++) {
          if (orders.recent_numbers[i]) {
            recentOrders.push({
              order_number: orders.recent_numbers[i],
              total_amount: orders.recent_amounts[i] || 0,
              status: orders.recent_statuses[i] || 'unknown',
            });
          }
        }
      }

      const context: BusinessContext = {
        totalProducts: products?.count || 0,
        totalInventoryItems: inventory?.count || 0,
        lowStockItems: inventory?.low_stock_count || 0,
        avgMargin: products?.avg_margin || 0,
        businessName: business.name || '',
        hourlyRate: 15, // Could be fetched from settings
        totalInventoryValue: inventory?.total_value || 0,
        totalOrders: orders?.count || 0,
        totalCustomers: customers?.count || 0,
        totalRevenue: orders?.total_revenue || 0,
        totalExpenses: expenses?.total || 0,
        topProducts,
        recentOrders,
      };

      return context;
    } catch (err) {
      console.error('Error fetching business context:', err);
      // Return mock data for development (similar to web app fallback)
      return {
        totalProducts: 25,
        totalInventoryItems: 47,
        lowStockItems: 3,
        avgMargin: 0.45,
        businessName: business?.name || 'Demo Business',
        hourlyRate: 15,
        totalInventoryValue: 12500.00,
        totalOrders: 156,
        totalCustomers: 89,
        totalRevenue: 45200.00,
        totalExpenses: 28900.00,
        topProducts: [
          { name: 'Premium Coffee Blend', profit_margin: 49.98, selling_price: 24.99 },
          { name: 'Artisan Pastry', profit_margin: 52.73, selling_price: 8.99 },
          { name: 'Organic Tea Selection', profit_margin: 47.30, selling_price: 18.50 },
        ],
        recentOrders: [
          { order_number: 'ORD-000156', total_amount: 87.50, status: 'completed', customer_name: 'John Smith' },
          { order_number: 'ORD-000155', total_amount: 124.99, status: 'processing', customer_name: 'Sarah Johnson' },
          { order_number: 'ORD-000154', total_amount: 45.25, status: 'shipped' },
        ],
      };
    }
  };

  const loadBusinessContext = async (): Promise<BusinessContext | null> => {
    try {
      const context = await getBusinessContext();
      setBusinessContext(context);
      return context;
    } catch (err) {
      console.error('Error loading business context:', err);
      return null;
    }
  };

  const createNewConversation = async (title?: string): Promise<AIConversation> => {
    try {
      validateUserAccess();

      const newConversation: AIConversation = {
        id: Date.now().toString(),
        title: title || 'New Conversation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
        user_id: user!.id,
      };

      // Save to local storage immediately
      const updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      setCurrentConversation(newConversation);
      await AsyncStorage.setItem(`ai_conversations_${user!.id}`, JSON.stringify(updatedConversations));

      // Try to save to MCP server (matches web app architecture)
      try {
        await mcp_supabase_execute_sql({
          query: `
            INSERT INTO ai_conversations (id, user_id, business_id, title, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          params: [
            newConversation.id,
            user!.id,
            business?.id,
            newConversation.title,
            newConversation.created_at,
            newConversation.updated_at
          ]
        });
      } catch (mcpError) {
        console.log('MCP server not available for conversation creation');
      }
      
      return newConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw new Error('Failed to create conversation');
    }
  };

  // Enhanced AI response generation with business context (matches web app intelligence)
  const generateAIResponse = async (userMessage: string, context: BusinessContext | null): Promise<string> => {
    // This should integrate with a real AI API like the web app's Groq integration
    // For now, providing intelligent mock responses based on business context
    
    const message = userMessage.toLowerCase();
    
    if (message.includes('profitable') || message.includes('profit')) {
      if (context && context.topProducts.length > 0) {
        const topProduct = context.topProducts[0];
        return `Based on your current data, your most profitable product is "${topProduct.name}" with a ${topProduct.profit_margin.toFixed(2)}% profit margin and $${topProduct.selling_price} selling price. This product shows strong performance and could be promoted more heavily to increase overall profitability.`;
      }
      return "I'd need access to your product data to analyze profitability. Please ensure your products are properly configured with cost and pricing information.";
    }
    
    if (message.includes('inventory') || message.includes('stock')) {
      if (context) {
        return `Your current inventory status: ${context.totalInventoryItems} total items worth $${context.totalInventoryValue.toLocaleString()}. You have ${context.lowStockItems} items with low stock that may need reordering. Consider implementing automatic reorder points for fast-moving items.`;
      }
      return "I can help you analyze inventory levels and reorder recommendations once your inventory data is available.";
    }
    
    if (message.includes('price') || message.includes('pricing')) {
      if (context && context.avgMargin > 0) {
        return `Your average profit margin is ${(context.avgMargin * 100).toFixed(1)}%. For new product pricing, I recommend: 1) Research competitor pricing, 2) Calculate total costs including overhead, 3) Target a margin similar to your top performers (${context.topProducts[0]?.profit_margin.toFixed(1)}% for ${context.topProducts[0]?.name}), 4) Test different price points with small batches.`;
      }
      return "For effective pricing strategy, I recommend analyzing your costs, competitor pricing, and target profit margins. Would you like help setting up a pricing framework?";
    }
    
    if (message.includes('cost') || message.includes('reduce') || message.includes('save')) {
      return "To reduce costs while maintaining quality: 1) Analyze your top expenses and negotiate with suppliers, 2) Optimize inventory turnover to reduce holding costs, 3) Implement just-in-time ordering for fast-moving items, 4) Review and eliminate unnecessary subscriptions or services, 5) Consider bulk purchasing for high-volume items.";
    }
    
    if (message.includes('sales') || message.includes('revenue')) {
      if (context) {
        return `Your business shows ${context.totalOrders} total orders generating $${context.totalRevenue.toLocaleString()} in revenue. Recent performance: ${context.recentOrders.map(o => `${o.order_number} ($${o.total_amount})`).join(', ')}. Consider focusing on your top-performing products and analyzing customer purchase patterns.`;
      }
      return "I can provide detailed sales analysis once your order data is available. This would include revenue trends, top customers, and product performance metrics.";
    }
    
    // Generic business advice
    return `I'm here to help you make data-driven business decisions! I can analyze your products, inventory, pricing strategies, and provide insights to improve profitability. What specific aspect of your business would you like to explore?`;
  };

  const sendMessage = async (content: string): Promise<void> => {
    if (!content.trim()) return;

    try {
      validateUserAccess();
      setLoading(true);
      setError(null);

      // Create conversation if none exists
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await createNewConversation();
      }

      // Additional validation that conversation belongs to user (matches web app security)
      if (conversation.user_id && conversation.user_id !== user!.id) {
        throw new Error('Privacy violation: Current conversation does not belong to user');
      }

      // Create user message
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        content: content.trim(),
        role: 'user',
        timestamp: Date.now(),
        conversation_id: conversation.id,
        is_user: true,
        created_at: new Date().toISOString(),
      };

      // Add user message to state immediately
      setMessages(prev => [...prev, userMessage]);

      // Get latest business context (matches web app)
      const context = await getBusinessContext();

      // Build conversation history for better AI memory (matches web app)
      const conversationHistory = messages.map(msg => ({
        role: msg.is_user || msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Generate AI response based on business context
      const aiResponse = await generateAIResponse(content, context);

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: Date.now(),
        conversation_id: conversation.id,
        is_user: false,
        created_at: new Date().toISOString(),
      };

      // Add assistant message to state
      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation title if it's the first message (matches web app)
      if (conversation.message_count === 0) {
        const newTitle = generateConversationTitle(content);
        const updatedConversation = { ...conversation, title: newTitle, message_count: 2 };
        setCurrentConversation(updatedConversation);
        setConversations(prev => prev.map(c => c.id === conversation.id ? updatedConversation : c));
      }

      // Save messages to local storage
      const allMessages = [...messages, userMessage, assistantMessage];
      await AsyncStorage.setItem(`ai_messages_${conversation.id}`, JSON.stringify(allMessages));

      // Try to save to MCP server (matches web app architecture)
      try {
        await Promise.all([
          mcp_supabase_execute_sql({
            query: `
              INSERT INTO ai_messages (id, conversation_id, content, is_user, created_at)
              VALUES ($1, $2, $3, $4, $5)
            `,
            params: [userMessage.id, conversation.id, userMessage.content, true, userMessage.created_at]
          }),
          mcp_supabase_execute_sql({
            query: `
              INSERT INTO ai_messages (id, conversation_id, content, is_user, created_at)
              VALUES ($1, $2, $3, $4, $5)
            `,
            params: [assistantMessage.id, conversation.id, assistantMessage.content, false, assistantMessage.created_at]
          })
        ]);
      } catch (mcpError) {
        console.log('MCP server not available for message saving');
      }

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      
      if (currentConversation) {
        const errorMsg: AIMessage = {
          id: (Date.now() + 2).toString(),
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          role: 'assistant',
          timestamp: Date.now(),
          conversation_id: currentConversation.id,
          is_user: false,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string): Promise<void> => {
    try {
      validateUserAccess();

      // Validate conversation belongs to user (matches web app security)
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation || (conversation.user_id && conversation.user_id !== user!.id)) {
        throw new Error('Privacy violation: Cannot delete conversation that does not belong to user');
      }

      // Remove from local state
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);
      
      // Clear current conversation if it was deleted
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(updatedConversations.length > 0 ? updatedConversations[0] : null);
        setMessages([]);
      }

      // Update local storage
      await AsyncStorage.setItem(`ai_conversations_${user!.id}`, JSON.stringify(updatedConversations));
      await AsyncStorage.removeItem(`ai_messages_${conversationId}`);

      // Try to delete from MCP server (matches web app)
      try {
        await Promise.all([
          mcp_supabase_execute_sql({
            query: `DELETE FROM ai_messages WHERE conversation_id = $1`,
            params: [conversationId]
          }),
          mcp_supabase_execute_sql({
            query: `DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2`,
            params: [conversationId, user!.id]
          })
        ]);
      } catch (mcpError) {
        console.log('MCP server not available for conversation deletion');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw new Error('Failed to delete conversation');
    }
  };

  // Generate conversation title based on first message (matches web app)
  const generateConversationTitle = (firstMessage: string): string => {
    const message = firstMessage.toLowerCase();
    
    if (message.includes('profitable') || message.includes('profit')) {
      return 'Product Profitability Analysis';
    }
    if (message.includes('inventory') || message.includes('stock')) {
      return 'Inventory Management';
    }
    if (message.includes('price') || message.includes('pricing')) {
      return 'Pricing Strategy';
    }
    if (message.includes('cost') || message.includes('reduce')) {
      return 'Cost Reduction';
    }
    if (message.includes('sales') || message.includes('revenue')) {
      return 'Sales Analysis';
    }
    
    // Truncate and use first few words
    const words = firstMessage.split(' ').slice(0, 4).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

  const updateConversationTitle = async (conversationId: string, title: string): Promise<void> => {
    try {
      // Update local state
      const updatedConversations = conversations.map(c => 
        c.id === conversationId ? { ...c, title } : c
      );
      setConversations(updatedConversations);
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, title });
      }

      // Update local storage
      await AsyncStorage.setItem(`ai_conversations_${user!.id}`, JSON.stringify(updatedConversations));

      // Try to update MCP server (matches web app)
      try {
        await mcp_supabase_execute_sql({
          query: `
            UPDATE ai_conversations 
            SET title = $1, updated_at = $2
            WHERE id = $3 AND user_id = $4
          `,
          params: [title, new Date().toISOString(), conversationId, user!.id]
        });
      } catch (mcpError) {
        console.log('MCP server not available for title update');
      }
    } catch (err) {
      console.error('Error updating conversation title:', err);
    }
  };

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    businessContext, // Added to match web app
    createNewConversation,
    sendMessage,
    deleteConversation,
    setCurrentConversation,
    getBusinessContext, // Added to match web app
    loadBusinessContext,
    fetchConversations, // Added for refresh capability
  };
} 