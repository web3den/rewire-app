import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { QuestCard } from '@/components/QuestCard';
import { GlowButton } from '@/components/GlowButton';
import { useAuthStore } from '@/stores/auth';
import { useQuestsStore } from '@/stores/quests';
import { useUserStore } from '@/stores/user';
import { colors, radius, spacing, typography } from '@/lib/theme';
import type { Quest, QuestAssignment } from '@/lib/types';

export default function QuestsScreen() {
  const { session, profile } = useAuthStore();
  const { anchor, choice, ember, choiceOptions, loading, fetchDailyQuests, completeQuest, refreshChoiceQuests, selectChoiceQuest, refreshesUsed } = useQuestsStore();
  const { fetchAll } = useUserStore();

  const [selectedQuest, setSelectedQuest] = useState<{
    assignment: QuestAssignment;
    quest: Quest;
  } | null>(null);
  const [reflection, setReflection] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (session?.user.id) {
      fetchDailyQuests();
      fetchAll();
    }
  }, [session?.user.id, fetchDailyQuests, fetchAll]);

  const handleQuestPress = (assignment: QuestAssignment) => {
    if (assignment.status === 'completed') return;
    if (assignment.quest) {
      setSelectedQuest({ assignment, quest: assignment.quest });
    }
  };

  const handleComplete = async () => {
    if (!selectedQuest || !session?.user.id) return;
    setCompleting(true);
    try {
      await completeQuest(
        selectedQuest.assignment.id,
        selectedQuest.quest.id,
        selectedQuest.quest.domain,
        reflection.trim() || undefined
      );
      setSelectedQuest(null);
      setReflection('');
      // Refresh user data
      await fetchAll();
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const handleRefresh = async () => {
    await refreshChoiceQuests();
  };

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

  const noQuests = !anchor && !choice && !ember;

  return (
    <AtmosphericBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.sectionTitle}>Today's Quests</Text>

          {noQuests ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No quests yet</Text>
              <Text style={styles.emptyText}>
                Your quests are being prepared. Check back soon — the fog has something for you.
              </Text>
              <GlowButton
                title="Refresh"
                variant="secondary"
                onPress={fetchDailyQuests}
                loading={loading}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <>
              {/* Anchor Quest */}
              {anchor?.quest && (
                <View>
                  <QuestCard
                    quest={anchor.quest}
                    slotType="anchor"
                    status={anchor.status}
                    onPress={() => handleQuestPress(anchor)}
                  />
                </View>
              )}

              {/* Choice Quest */}
              {choice && (
                <View>
                  {choice.status === 'active' && choiceOptions.length > 0 ? (
                    <>
                      <Text style={styles.choiceLabel}>Choose your quest</Text>
                      {choiceOptions.map((opt) => (
                        <Pressable
                          key={opt.id}
                          onPress={() => selectChoiceQuest(opt.id)}
                          style={styles.choiceOption}
                        >
                          <QuestCard
                            quest={opt}
                            slotType="choice"
                            status="active"
                            onPress={() => selectChoiceQuest(opt.id)}
                          />
                        </Pressable>
                      ))}
                      <GlowButton
                        title={refreshesUsed === 0 ? 'Shuffle (1 free)' : 'Shuffle (1 Spark)'}
                        variant="ghost"
                        onPress={handleRefresh}
                        loading={loading}
                        style={{ marginBottom: spacing.md }}
                      />
                    </>
                  ) : choice.quest ? (
                    <QuestCard
                      quest={choice.quest}
                      slotType="choice"
                      status={choice.status}
                      onPress={() => handleQuestPress(choice)}
                    />
                  ) : null}
                </View>
              )}

              {/* Ember Quest */}
              {ember?.quest && (
                <QuestCard
                  quest={ember.quest}
                  slotType="ember"
                  status={ember.status}
                  onPress={() => handleQuestPress(ember)}
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Quest completion modal */}
        <Modal
          visible={selectedQuest !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedQuest(null)}
        >
          <View style={styles.modal}>
            {selectedQuest && (
              <>
                <View style={styles.modalHeader}>
                  <Pressable
                    onPress={() => setSelectedQuest(null)}
                    style={styles.modalClose}
                  >
                    <Text style={styles.modalCloseText}>Close</Text>
                  </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalScroll}>
                  <Text style={styles.modalTitle}>{selectedQuest.quest.title}</Text>
                  <Text style={styles.modalNarrative}>
                    {selectedQuest.quest.narrative_intro}
                  </Text>
                  <Text style={styles.modalInstruction}>
                    {selectedQuest.quest.instruction}
                  </Text>

                  <View style={styles.reflectionSection}>
                    <Text style={styles.reflectionLabel}>
                      Reflection (optional)
                    </Text>
                    <TextInput
                      style={styles.reflectionInput}
                      placeholder="How did this feel?"
                      placeholderTextColor={colors.text.muted}
                      value={reflection}
                      onChangeText={setReflection}
                      multiline
                      maxLength={500}
                      textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>
                      {reflection.length}/500
                    </Text>
                  </View>

                  <GlowButton
                    title="Complete Quest"
                    onPress={handleComplete}
                    loading={completing}
                    style={{ marginTop: spacing.lg }}
                  />
                </ScrollView>
              </>
            )}
          </View>
        </Modal>
      </SafeAreaView>
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
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodySmall,
    color: colors.text.muted,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  choiceLabel: {
    ...typography.label,
    color: colors.gold.DEFAULT,
    marginBottom: spacing.sm,
  },
  choiceOption: {
    // Wrapper for choice quest cards — no extra styling needed
  },
  // Modal
  modal: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  modalClose: {
    padding: spacing.sm,
  },
  modalCloseText: {
    color: colors.gold.DEFAULT,
    fontSize: 16,
    fontWeight: '500',
  },
  modalScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: {
    ...typography.title,
    marginBottom: spacing.md,
  },
  modalNarrative: {
    ...typography.body,
    color: colors.gold.light,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  modalInstruction: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.lg,
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  reflectionSection: {
    marginTop: spacing.md,
  },
  reflectionLabel: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  reflectionInput: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
