import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

interface Props {
  role: 'user' | 'guide';
  content: string;
}

export function ChatBubble({ role, content }: Props) {
  const isGuide = role === 'guide';

  return (
    <View style={[styles.wrapper, isGuide ? styles.guideWrapper : styles.userWrapper]}>
      <View style={[styles.bubble, isGuide ? styles.guideBubble : styles.userBubble]}>
        <Text style={[styles.text, isGuide ? styles.guideText : styles.userText]}>
          {content}
        </Text>
      </View>
    </View>
  );
}

export function TypingIndicator() {
  return (
    <View style={[styles.wrapper, styles.guideWrapper]}>
      <View style={[styles.bubble, styles.guideBubble, styles.typing]}>
        <Text style={styles.dots}>...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  guideWrapper: {
    alignItems: 'flex-start',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  guideBubble: {
    backgroundColor: 'rgba(232, 168, 56, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 56, 0.15)',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.bg.elevated,
    borderTopRightRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 23,
  },
  guideText: {
    color: colors.gold.light,
  },
  userText: {
    color: colors.text.primary,
  },
  typing: {
    paddingVertical: spacing.sm,
  },
  dots: {
    color: colors.gold.DEFAULT,
    fontSize: 24,
    letterSpacing: 4,
  },
});
