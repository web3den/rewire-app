import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { QuestCard } from '@/components/QuestCard';
import { GlowButton } from '@/components/GlowButton';
import { QuestCompletionSequence, type CompletionStats } from '@/components/QuestCompletionSequence';
import { SkipConfirmModal } from '@/components/SkipConfirmModal';
import { useAuthStore } from '@/stores/auth';
import { useQuestsStore } from '@/stores/quests';
import { useUserStore } from '@/stores/user';
import { colors, radius, spacing, typography } from '@/lib/theme';
import type { Quest, QuestAssignment } from '@/lib/types';
import type { CompletionContext } from '@/lib/kael-completions';

export default function QuestsScreen() {
  const { session, profile } = useAuthStore();
  const { anchor, choice, ember, choiceOptions, loading, networkError, fetchDailyQuests, completeQuest, skipQuest, refreshChoiceQuests, clearNetworkError } = useQuestsStore();
  const { fetchAll, sparks } = useUserStore();

  const [selectedQuest, setSelectedQuest] = useState<{ assignment: QuestAssignment; quest: Quest } | null>(null);
  const [reflection, setReflection] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [completionCtx, setCompletionCtx] = useState<CompletionContext | null>(null);
  const [prevStats, setPrevStats] = useState<CompletionStats | undefined>();
  const completedSlotsTodayRef = useRef(0);

  // WP5: Skip flow state
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const skipTargetRef = useRef<{ assignment: QuestAssignment; quest: Quest } | null>(null);

  useEffect(() => {
    if (session?.user.id) {
      fetchDailyQuests();
      fetchAll();
    }
  }, [session?.user.id, fetchDailyQuests, fetchAll]);

  const handleQuestTap = (assignment: QuestAssignment, quest: Quest) => {
    setSelectedQuest({ assignment, quest });
  };

  const handleComplete = async () => {
    if (!selectedQuest || !session?.user.id) return;
    setCompleting(true);
    try {
      // Snapshot sparks before completing
      const currentSparks = useUserStore.getState().sparks?.sparks ?? 0;
      const snapStats: CompletionStats = {
        sparks: currentSparks,
        streak: 0,
        domainsActive: 1,
      };
      setPrevStats(snapStats);

      const result = await completeQuest(
        selectedQuest.assignment.id,
        selectedQuest.quest.id,
        selectedQuest.quest.domain,
        reflection.trim() || undefined
      );

      if (!result) return; // error already shown by store

      // Count how many slots are now completed
      const store = useQuestsStore.getState();
      const completed = [store.anchor, store.choice, store.ember].filter(
        (a) => a?.status === 'completed'
      ).length + 1;
      completedSlotsTodayRef.current = completed;

      // Build completion context with real streak data from WP6 response
      const ctx: CompletionContext = {
        domain: selectedQuest.quest.domain,
        tier: selectedQuest.quest.tier,
        energyLevel: 0.5,
        streakDays: result.streak_days ?? 0,
        isFirstInDomain: false,
        skippedYesterday: false,
      };
      setCompletionCtx(ctx);
      setSelectedQuest(null);
      setReflection('');
      setCompletionVisible(true);
    } finally {
      setCompleting(false);
    }
  };

  // WP5: open skip confirmation
  const handleSkipPress = useCallback(() => {
    if (!selectedQuest) return;
    skipTargetRef.current = selectedQuest;
    setSkipModalVisible(true);
  }, [selectedQuest]);

  // WP5: confirmed skip
  const handleSkipConfirm = useCallback(async () => {
    const target = skipTargetRef.current;
    if (!target) return;
    setSkipModalVisible(false);
    setSelectedQuest(null);
    await skipQuest(target.assignment.id, target.quest.domain);
    skipTargetRef.current = null;
  }, [skipQuest]);

  // WP5: cancelled skip
  const handleSkipCancel = useCallback(() => {
    setSkipModalVisible(false);
    skipTargetRef.current = null;
  }, []);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    const name = profile?.display_name ?? 'Traveler';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  if (loading && !anchor && !ember) {
    return (
      <AtmosphericBackground>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.gold.DEFAULT} />
          <Text style={styles.loadingText}>Preparing your quests...</Text>
        </SafeAreaView>
      </AtmosphericBackground>
    );
  }

  return (
    <AtmosphericBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* NETWORK ERROR BANNER */}
        {networkError && (
          <Pressable style={styles.errorBanner} onPress={clearNetworkError}>
            <Text style={styles.errorBannerText}>⚠ Connection issue — tap to retry</Text>
            <GlowButton
              title="Retry"
              variant="secondary"
              onPress={() => { clearNetworkError(); fetchDailyQuests(); }}
              style={{ marginTop: 4 }}
            />
          </Pressable>
        )}

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* SPARK COUNTER */}
          <View style={styles.sparkRow}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkText}>⚡ {sparks?.sparks ?? 0}</Text>
            </View>
          </View>

          {!anchor && !ember ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No quests yet</Text>
              <Text style={styles.emptyText}>The fog is preparing something for you.</Text>
              <GlowButton
                title="Refresh"
                onPress={fetchDailyQuests}
                loading={loading}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <>
              {/* TODAY'S QUEST */}
              {anchor?.quest && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Today's Quest</Text>
                  <Pressable onPress={() => handleQuestTap(anchor, anchor.quest!)}>
                    <QuestCard quest={anchor.quest!} slotType="anchor" status={anchor.status} onPress={() => handleQuestTap(anchor, anchor.quest!)} />
                  </Pressable>
                </View>
              )}

              {/* CHOOSE ONE */}
              {choiceOptions.length > 0 && choice?.quest && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Choose One</Text>
                  <View style={styles.choiceContainer}>
                    {choiceOptions.map((quest) => (
                      <Pressable 
                        key={quest.id} 
                        onPress={() => handleQuestTap(choice, quest)}
                        style={styles.choiceCard}
                      >
                        <QuestCard quest={quest} slotType="choice" status="active" onPress={() => {}} />
                      </Pressable>
                    ))}
                  </View>
                  <GlowButton
                    title="Different Options"
                    variant="secondary"
                    onPress={refreshChoiceQuests}
                    loading={loading}
                    style={{ marginTop: spacing.md }}
                  />
                </View>
              )}

              {/* SOMETHING QUICK */}
              {ember?.quest && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Something Quick</Text>
                  <Pressable onPress={() => handleQuestTap(ember, ember.quest!)}>
                    <QuestCard quest={ember.quest!} slotType="ember" status={ember.status} onPress={() => handleQuestTap(ember, ember.quest!)} />
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* QUEST DETAIL MODAL */}
        <Modal visible={!!selectedQuest} transparent animationType="slide" onRequestClose={() => setSelectedQuest(null)}>
          <SafeAreaView style={styles.modal}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedQuest && (
                <>
                  <Pressable onPress={() => setSelectedQuest(null)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </Pressable>
                  
                  <Text style={styles.modalTitle}>{selectedQuest.quest.title}</Text>
                  <Text style={styles.modalDescription}>{selectedQuest.quest.description}</Text>

                  <Text style={styles.reflectionLabel}>How do you feel?</Text>
                  <View style={styles.reflectionInput} />

                  <GlowButton
                    title={completing ? 'Completing...' : 'Complete Quest'}
                    onPress={handleComplete}
                    loading={completing}
                    style={{ marginTop: spacing.xl }}
                  />

                  <GlowButton
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setSelectedQuest(null)}
                    style={{ marginTop: spacing.md }}
                  />

                  {/* WP5: Skip This — bottom of modal, low visual weight */}
                  {selectedQuest?.assignment.status !== 'skipped' && (
                    <Pressable onPress={handleSkipPress} style={styles.skipButton}>
                      <Text style={styles.skipButtonText}>Not feeling it</Text>
                    </Pressable>
                  )}
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>

      {/* WP5: SKIP CONFIRMATION */}
      <SkipConfirmModal
        visible={skipModalVisible}
        questTitle={skipTargetRef.current?.quest.title ?? ''}
        onConfirm={handleSkipConfirm}
        onCancel={handleSkipCancel}
      />

      {/* COMPLETION SEQUENCE */}
      {completionCtx && (
        <QuestCompletionSequence
          visible={completionVisible}
          context={completionCtx}
          previousStats={prevStats}
          completedSlotsToday={completedSlotsTodayRef.current}
          onDismiss={() => {
            setCompletionVisible(false);
            setCompletionCtx(null);
          }}
        />
      )}
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    ...typography.heading,
    marginBottom: spacing.lg,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.gold.DEFAULT,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  choiceContainer: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  choiceCard: {
    marginBottom: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  modalContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  modalTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  modalDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  reflectionLabel: {
    ...typography.label,
    color: colors.gold.DEFAULT,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  reflectionInput: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 100,
    marginBottom: spacing.lg,
  },
  // WP6: spark + error
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sparkBadge: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.full ?? 99,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs ?? 4,
  },
  sparkText: {
    ...typography.label,
    color: colors.gold.DEFAULT,
  },
  errorBanner: {
    backgroundColor: '#3a1a1a',
    padding: spacing.md,
    alignItems: 'center',
  },
  errorBannerText: {
    ...typography.body,
    color: '#ff8080',
    marginBottom: spacing.sm,
  },
  // WP5
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
    opacity: 0.6,
  },
  skipButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
