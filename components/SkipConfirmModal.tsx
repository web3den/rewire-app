/**
 * SkipConfirmModal — WP5 Pre-Quest Skip Flow
 *
 * Kael speaks first, validates the choice, then user confirms.
 * No Spark loss, no energy cost — just compassionate acknowledgment.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getPreQuestSkipLine } from '@/lib/kael-skip';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { GlowButton } from '@/components/GlowButton';

interface Props {
  visible: boolean;
  questTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SkipConfirmModal({ visible, questTitle, onConfirm, onCancel }: Props) {
  const kaelLine = useRef(getPreQuestSkipLine());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      // Refresh Kael's line each time modal opens
      kaelLine.current = getPreQuestSkipLine();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleConfirm = useCallback(async () => {
    // Gentle buzz — not success vibration, just acknowledgment
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Animated.View
          style={[
            styles.sheet,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Prevent backdrop tap from closing when tapping inside */}
          <Pressable onPress={() => {}}>
            {/* Kael avatar hint */}
            <Text style={styles.kaelName}>Kael</Text>

            {/* Kael's response */}
            <Text style={styles.kaelLine}>"{kaelLine.current}"</Text>

            {/* Quest context */}
            <Text style={styles.questContext}>
              Skip: <Text style={styles.questTitle}>{questTitle}</Text>
            </Text>

            <Text style={styles.note}>
              No Sparks lost · No energy cost · Counts toward your day
            </Text>

            {/* CTAs */}
            <GlowButton
              title="Rest for now"
              onPress={handleConfirm}
              style={styles.confirmBtn}
            />

            <Pressable onPress={handleCancel} style={styles.goBackBtn}>
              <Text style={styles.goBackText}>Actually, I'll try it</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  kaelName: {
    ...typography.label,
    color: colors.gold.DEFAULT,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  kaelLine: {
    ...typography.body,
    color: colors.text.primary,
    fontSize: 17,
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  questContext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  questTitle: {
    color: colors.text.primary,
    fontStyle: 'normal',
  },
  note: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    opacity: 0.7,
  },
  confirmBtn: {
    marginBottom: spacing.md,
  },
  goBackBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  goBackText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
