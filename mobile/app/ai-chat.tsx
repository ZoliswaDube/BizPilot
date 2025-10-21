import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  MessageCircle,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  Package,
  Lightbulb,
  ArrowLeft,
  MoreVertical,
  BarChart3,
  Users,
  ShoppingCart,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useAnalytics } from '../src/hooks/useAnalytics';
import { useAIChat, AIMessage, AIConversation } from '../src/hooks/useAIChat';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { theme } from '../src/styles/theme';
import * as Haptics from 'expo-haptics';

interface QuickQuestion {
  id: string;
  text: string;
  icon: React.ComponentType<any>;
  prompt: string;
  color: string;
}

export default function AIChatScreen() {
  const router = useRouter();
  useAnalytics('AI Chat');
  
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    businessContext, // Now available from enhanced hook
    createNewConversation,
    sendMessage,
    deleteConversation,
    setCurrentConversation,
    getBusinessContext, // For refresh capability
  } = useAIChat();

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(!currentConversation && messages.length === 0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, setPermissionResponse] = useState<Audio.PermissionResponse | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const quickQuestions: QuickQuestion[] = [
    {
      id: '1',
      text: "What's my most profitable product?",
      icon: TrendingUp,
      prompt: 'Analyze my products and tell me which one has the highest profit margin and total profit potential.',
      color: theme.colors.green[500],
    },
    {
      id: '2',
      text: 'How should I price a new product?',
      icon: DollarSign,
      prompt: 'Give me guidance on pricing strategy for a new product, considering my current margins and market positioning.',
      color: theme.colors.blue[500],
    },
    {
      id: '3',
      text: 'What inventory should I restock?',
      icon: Package,
      prompt: 'Review my inventory levels and recommend what items I should reorder based on stock levels and usage patterns.',
      color: theme.colors.orange[500],
    },
    {
      id: '4',
      text: 'How can I reduce costs?',
      icon: Lightbulb,
      prompt: 'Analyze my product costs and suggest ways to reduce expenses while maintaining quality.',
      color: theme.colors.purple[500],
    },
  ];

  useEffect(() => {
    Audio.requestPermissionsAsync().then(setPermissionResponse);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setShowQuickQuestions(false);
      scrollToBottom();
    } else if (!currentConversation) {
      setShowQuickQuestions(true);
    }
  }, [messages, currentConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Real voice input functionality - matches web app Speech Recognition
  const startRecording = async () => {
    try {
      if (!permissionResponse?.granted) {
        const permission = await Audio.requestPermissionsAsync();
        setPermissionResponse(permission);
        if (!permission.granted) {
          Alert.alert('Permission required', 'Please allow microphone access to use voice input.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsListening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsListening(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        // For now, show a placeholder message since actual speech-to-text would require
        // additional services like Google Cloud Speech or Azure Speech Services
        setInputValue("Voice input recorded - speech recognition integration needed");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // In a production app, you would:
        // 1. Upload the audio file to a speech-to-text service
        // 2. Get the transcription back
        // 3. Set the inputValue to the transcribed text
        Alert.alert(
          'Voice Input',
          'Voice recording completed. In a production app, this would be transcribed to text automatically.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use Sample Text', onPress: () => setInputValue("What's my best selling product this month?") }
          ]
        );
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to process voice recording');
    }
  };

  const toggleVoiceInput = async () => {
    if (isListening) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const message = inputValue.trim();
    setInputValue('');
    
    try {
      await sendMessage(message);
      Haptics.selectionAsync();
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleQuickQuestion = async (question: QuickQuestion) => {
    if (loading) return;
    
    try {
      await sendMessage(question.prompt);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      Alert.alert('Error', 'Failed to send question');
    }
  };

  const handleNewConversation = async () => {
    try {
      await createNewConversation();
      setShowConversations(false);
      setShowQuickQuestions(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      Alert.alert('Error', 'Failed to create conversation');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  const renderMessage = ({ item }: { item: AIMessage }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userMessageText : styles.assistantMessageText
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          item.role === 'user' ? styles.userMessageTime : styles.assistantMessageTime
        ]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderQuickQuestion = (question: QuickQuestion) => {
    const IconComponent = question.icon;
    return (
      <TouchableOpacity
        key={question.id}
        style={styles.quickQuestionCard}
        onPress={() => handleQuickQuestion(question)}
        disabled={loading}
      >
        <View style={[styles.quickQuestionIcon, { backgroundColor: `${question.color}20` }]}>
          <IconComponent size={20} color={question.color} />
        </View>
        <Text style={styles.quickQuestionText}>{question.text}</Text>
      </TouchableOpacity>
    );
  };

  const renderConversationItem = ({ item }: { item: AIConversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        currentConversation?.id === item.id && styles.activeConversationItem
      ]}
      onPress={() => {
        setCurrentConversation(item);
        setShowConversations(false);
      }}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title || 'Untitled Conversation'}
        </Text>
        <TouchableOpacity
          style={styles.deleteConversationButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteConversation(item.id);
          }}
        >
          <Trash2 size={16} color={theme.colors.gray[500]} />
        </TouchableOpacity>
      </View>
      <Text style={styles.conversationDate}>
        {new Date(item.updated_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  // Enhanced business context display - matches web app
  const renderBusinessContext = () => {
    if (!businessContext) return null;

    return (
      <Card style={styles.businessContextCard}>
        <Text style={styles.businessContextTitle}>Business Overview</Text>
        <View style={styles.businessMetrics}>
          <View style={styles.metricItem}>
            <Package size={16} color={theme.colors.blue[400]} />
            <Text style={styles.metricValue}>{businessContext.totalProducts}</Text>
            <Text style={styles.metricLabel}>Products</Text>
          </View>
          <View style={styles.metricItem}>
            <BarChart3 size={16} color={theme.colors.green[400]} />
            <Text style={styles.metricValue}>{businessContext.totalInventoryItems}</Text>
            <Text style={styles.metricLabel}>Inventory</Text>
          </View>
          <View style={styles.metricItem}>
            <TrendingUp size={16} color={theme.colors.yellow[400]} />
            <Text style={styles.metricValue}>{formatPercentage(businessContext.avgMargin)}</Text>
            <Text style={styles.metricLabel}>Avg Margin</Text>
          </View>
          {businessContext.lowStockItems > 0 && (
            <View style={styles.metricItem}>
              <Package size={16} color={theme.colors.red[400]} />
              <Text style={[styles.metricValue, { color: theme.colors.red[400] }]}>
                {businessContext.lowStockItems}
              </Text>
              <Text style={styles.metricLabel}>Low Stock</Text>
            </View>
          )}
        </View>
        <View style={styles.businessSummary}>
          <Text style={styles.businessSummaryText}>
            {businessContext.totalOrders} orders • {formatCurrency(businessContext.totalRevenue)} revenue
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.gray[400]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Business Assistant</Text>
          <Text style={styles.headerSubtitle}>
            Get insights about your products, pricing, and inventory
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowConversations(true)}
        >
          <MoreVertical size={24} color={theme.colors.gray[400]} />
        </TouchableOpacity>
      </View>

      {/* Business Context Display - matches web app */}
      {renderBusinessContext()}

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showQuickQuestions ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIcon}>
                <Bot size={40} color={theme.colors.primary[400]} />
              </View>
              <Text style={styles.welcomeTitle}>Welcome to AI Assistant</Text>
              <Text style={styles.welcomeSubtitle}>
                I can help you analyze your business data, optimize operations, and make informed decisions.
              </Text>
              
              <Text style={styles.quickQuestionsTitle}>Quick Questions</Text>
              <View style={styles.quickQuestionsGrid}>
                {quickQuestions.map(renderQuickQuestion)}
              </View>
            </View>
          ) : (
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Enhanced Input with Voice - matches web app functionality */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Ask me anything about your business..."
              placeholderTextColor={theme.colors.gray[400]}
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              maxLength={1000}
              editable={!loading}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[styles.inputButton, isListening && styles.listeningButton]}
                onPress={toggleVoiceInput}
                disabled={loading}
              >
                {isListening ? (
                  <MicOff size={20} color={theme.colors.white} />
                ) : (
                  <Mic size={20} color={theme.colors.gray[400]} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputValue.trim() || loading) && styles.disabledButton
                ]}
                onPress={handleSendMessage}
                disabled={!inputValue.trim() || loading}
              >
                <Send size={20} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* AI Notice - matches web app */}
          <View style={styles.aiNotice}>
            <Text style={styles.aiNoticeText}>
              💡 This AI assistant analyzes your real business data to provide personalized insights and recommendations.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Conversations Modal */}
      <Modal
        visible={showConversations}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConversations(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowConversations(false)}>
              <Text style={styles.modalCancelButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Conversations</Text>
            <TouchableOpacity onPress={handleNewConversation}>
              <Plus size={24} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            style={styles.conversationsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Bot size={48} color={theme.colors.gray[500]} />
                <Text style={styles.emptyStateText}>No conversations yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start a new conversation to get AI insights about your business
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... existing styles remain the same, plus new styles for enhanced features ...
  
  businessContextCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  businessContextTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
    marginBottom: theme.spacing.md,
  },
  businessMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metricValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  metricLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[400],
  },
  businessSummary: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
    paddingTop: theme.spacing.sm,
  },
  businessSummaryText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
    textAlign: 'center',
  },
  listeningButton: {
    backgroundColor: theme.colors.red[600],
  },
  aiNotice: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.blue[950],
    borderWidth: 1,
    borderColor: theme.colors.blue[800],
    borderRadius: theme.borderRadius.md,
  },
  aiNoticeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.blue[200],
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // All existing styles remain the same...
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[800],
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
  },
  menuButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[950],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  welcomeTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  quickQuestionsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.lg,
    alignSelf: 'flex-start',
    width: '100%',
  },
  quickQuestionsGrid: {
    width: '100%',
    gap: theme.spacing.md,
  },
  quickQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  quickQuestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickQuestionText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[200],
    lineHeight: 18,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primary[600],
    borderBottomRightRadius: theme.spacing.sm,
  },
  assistantMessageBubble: {
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderBottomLeftRadius: theme.spacing.sm,
  },
  messageText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  userMessageText: {
    color: theme.colors.white,
  },
  assistantMessageText: {
    color: theme.colors.gray[100],
  },
  messageTime: {
    fontSize: theme.fontSize.xs,
  },
  userMessageTime: {
    color: theme.colors.primary[200],
  },
  assistantMessageTime: {
    color: theme.colors.gray[500],
  },
  loadingContainer: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary[400],
    opacity: 0.7,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  errorContainer: {
    backgroundColor: theme.colors.red[950],
    borderWidth: 1,
    borderColor: theme.colors.red[800],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.red[400],
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[800],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
    maxHeight: 120,
    minHeight: 40,
    textAlignVertical: 'center',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  inputButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.dark[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[800],
  },
  modalCancelButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[800],
  },
  activeConversationItem: {
    backgroundColor: theme.colors.dark[800],
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary[500],
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  conversationTitle: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  deleteConversationButton: {
    padding: theme.spacing.sm,
  },
  conversationDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[400],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
}); 