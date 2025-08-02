import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Plus,
  Bot,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAIChat, AIMessage } from '../hooks/useAIChat';
import { theme } from '../styles/theme';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function GlobalAIChat() {
  const router = useRouter();
  const {
    messages,
    loading,
    sendMessage,
    currentConversation,
    createNewConversation,
  } = useAIChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<ScrollView>(null);

  // Don't show on AI chat page (matches web app behavior)
  const isAIChatPage = router.pathname === '/ai-chat';
  if (isAIChatPage) {
    return null;
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    // Create conversation if none exists (matches web app)
    if (!currentConversation) {
      await createNewConversation();
    }

    await sendMessage(message.trim());
    setMessage('');
    Haptics.selectionAsync();
  };

  const handleKeyPress = () => {
    // For mobile, we'll handle send via button only
    handleSendMessage();
  };

  const handleNewConversation = async () => {
    await createNewConversation();
    setMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renderMessage = (msg: AIMessage, index: number) => (
    <View
      key={msg.id || index}
      style={[
        styles.messageContainer,
        msg.role === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          msg.role === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
          ]}
        >
          {msg.content}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      {/* Chat Toggle Button - matches web app floating button */}
      {!isOpen && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            setIsOpen(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.8}
        >
          <MessageCircle size={24} color={theme.colors.white} />
        </TouchableOpacity>
      )}

      {/* Chat Modal - matches web app modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View
              style={[
                styles.chatModal,
                isMinimized ? styles.minimizedModal : styles.expandedModal,
              ]}
            >
              {/* Header - matches web app header */}
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <MessageCircle size={20} color={theme.colors.primary[400]} />
                  <Text style={styles.headerTitle}>AI Assistant</Text>
                </View>
                <View style={styles.headerRight}>
                  {!isMinimized && (
                    <TouchableOpacity
                      onPress={handleNewConversation}
                      style={styles.newButton}
                      disabled={loading}
                    >
                      <Text style={styles.newButtonText}>New</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setIsMinimized(!isMinimized);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={styles.headerButton}
                  >
                    {isMinimized ? (
                      <Maximize2 size={16} color={theme.colors.gray[400]} />
                    ) : (
                      <Minimize2 size={16} color={theme.colors.gray[400]} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    style={styles.headerButton}
                  >
                    <X size={16} color={theme.colors.gray[400]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Chat Content - only shown when not minimized */}
              {!isMinimized && (
                <>
                  {/* Messages */}
                  <ScrollView
                    ref={messagesEndRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {messages.length === 0 ? (
                      <View style={styles.emptyState}>
                        <MessageCircle size={32} color={theme.colors.gray[500]} />
                        <Text style={styles.emptyStateText}>
                          Ask me anything about your business!
                        </Text>
                      </View>
                    ) : (
                      messages.map(renderMessage)
                    )}

                    {loading && (
                      <View style={styles.loadingContainer}>
                        <View style={styles.loadingBubble}>
                          <View style={styles.typingIndicator}>
                            <View style={styles.typingDot} />
                            <View style={styles.typingDot} />
                            <View style={styles.typingDot} />
                          </View>
                        </View>
                      </View>
                    )}
                  </ScrollView>

                  {/* Input - matches web app input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Ask about your business..."
                        placeholderTextColor={theme.colors.gray[400]}
                        multiline
                        maxLength={500}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!message.trim() || loading}
                        style={[
                          styles.sendButton,
                          (!message.trim() || loading) && styles.disabledButton,
                        ]}
                      >
                        <Send size={16} color={theme.colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.blue[600],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 24,
    paddingRight: 24,
  },
  keyboardAvoidingView: {
    maxHeight: screenHeight * 0.8,
  },
  chatModal: {
    backgroundColor: theme.colors.dark[900],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.dark[700],
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  minimizedModal: {
    width: Math.min(320, screenWidth - 48),
    height: 64,
  },
  expandedModal: {
    width: Math.min(384, screenWidth - 48),
    height: Math.min(500, screenHeight * 0.7),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[700],
    backgroundColor: theme.colors.dark[800],
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[100],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  newButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  newButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  headerButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  messagesContainer: {
    flex: 1,
    maxHeight: 320,
  },
  messagesContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: theme.spacing.sm,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primary[600],
    borderBottomRightRadius: theme.spacing.xs,
  },
  assistantMessageBubble: {
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderBottomLeftRadius: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  userMessageText: {
    color: theme.colors.white,
  },
  assistantMessageText: {
    color: theme.colors.gray[100],
  },
  loadingContainer: {
    alignItems: 'flex-start',
  },
  loadingBubble: {
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary[400],
    opacity: 0.7,
  },
  inputContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[100],
    maxHeight: 80,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 