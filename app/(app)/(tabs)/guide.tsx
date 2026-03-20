import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { ChatBubble, TypingIndicator } from '@/components/ChatBubble';
import { useAuthStore } from '@/stores/auth';
import { useGuideStore } from '@/stores/guide';
import { useUserStore } from '@/stores/user';
import { colors, radius, spacing, typography, TOUCH_MIN } from '@/lib/theme';
import type { ConversationMessage } from '@/lib/types';

export default function GuideScreen() {
  const { session } = useAuthStore();
  const {
    sessionId,
    messages,
    loading,
    energyUsed,
    maxEnergy,
    startSession,
    sendMessage,
    loadSession,
  } = useGuideStore();
  const { currencies } = useUserStore();

  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (session?.user.id) {
      loadSession();
    }
  }, [session?.user.id, loadSession]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');

    if (!sessionId) {
      await startSession();
    }

    await sendMessage(msg);
  };

  const energyRemaining = (currencies?.energy ?? 5) - energyUsed;
  const isOutOfEnergy = energyRemaining <= 0;

  const getWelcomeMessage = (): ConversationMessage | null => {
    if (messages.length > 0) return null;
    const hour = new Date().getHours();
    let greeting: string;
    if (hour < 12) greeting = "The morning fog is thin today. What's on your mind?";
    else if (hour < 17) greeting = "Afternoon. The fog shifts differently in daylight. What brings you here?";
    else greeting = "Evening. The fog is quiet now. Good time to talk.";

    return {
      id: 'welcome',
      session_id: sessionId ?? '',
      user_id: session?.user.id ?? '',
      role: 'guide',
      content: greeting,
      crisis_level: 'normal',
      created_at: new Date().toISOString(),
    };
  };

  const welcomeMsg = getWelcomeMessage();
  const allMessages = welcomeMsg ? [welcomeMsg, ...messages] : messages;

  return (
    <AtmosphericBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kael</Text>
          <Text style={styles.energyBadge}>
            {Math.max(0, energyRemaining)} of {maxEnergy} remaining
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble role={item.role} content={item.content} />
          )}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <View style={styles.inputContainer}>
            {isOutOfEnergy ? (
              <Text style={styles.outOfEnergy}>
                My voice grows faint. Complete a quest to strengthen our connection.
              </Text>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Say something..."
                  placeholderTextColor={colors.text.muted}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  editable={!loading}
                />
                <Pressable
                  onPress={handleSend}
                  disabled={!input.trim() || loading}
                  style={[styles.sendButton, (!input.trim() || loading) && styles.sendDisabled]}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                >
                  <Text style={styles.sendText}>Send</Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.gold.DEFAULT,
  },
  energyBadge: {
    ...typography.caption,
    color: colors.text.muted,
  },
  messages: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.secondary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text.primary,
    maxHeight: 100,
    minHeight: TOUCH_MIN,
  },
  sendButton: {
    minWidth: TOUCH_MIN,
    minHeight: TOUCH_MIN,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: colors.gold.DEFAULT,
    fontSize: 16,
    fontWeight: '600',
  },
  outOfEnergy: {
    ...typography.body,
    color: colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
    flex: 1,
  },
});
