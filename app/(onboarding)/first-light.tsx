import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { AffectSelector } from '@/components/AffectSelector';
import { EnergySlider } from '@/components/EnergySlider';
import { GlowButton } from '@/components/GlowButton';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { initializeFromScenarios } from '@/lib/archetype-engine';
import { colors, spacing, typography } from '@/lib/theme';
import type { QuestDomain, FirstLightData } from '@/lib/types';
import { requestNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';

const DIRECTION_CARDS: { emoji: string; label: string; sublabel: string; domain: QuestDomain }[] = [
  { emoji: '🏔️', label: 'Something in me', sublabel: 'Spirit / Depth', domain: 'spirit' },
  { emoji: '🌿', label: 'Something around me', sublabel: 'Order / Foundation', domain: 'order' },
  { emoji: '🌉', label: 'Someone in my life', sublabel: 'Heart / Connection', domain: 'heart' },
  { emoji: '⚡', label: "Something I've been avoiding", sublabel: 'Courage / Valor', domain: 'courage' },
];

export default function FirstLightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ domains: string; track: string; checkIn: string }>();
  const { session, fetchProfile } = useAuthStore();

  const [step, setStep] = useState(0);
  const [affect, setAffect] = useState<'heavy' | 'restless' | 'numb' | null>(null);
  const [energy, setEnergy] = useState(0.5);
  const [direction, setDirection] = useState<QuestDomain | null>(null);
  const [loading, setLoading] = useState(false);

  const canContinue = (): boolean => {
    if (step === 0) return affect !== null;
    if (step === 1) return true; // slider always has a value
    if (step === 2) return direction !== null;
    return false;
  };

  const getKaelIntro = (): string => {
    if (step === 0)
      return "Most apps start here with a goal. 'What do you want to achieve?' As if you haven't already tried that. I want to start somewhere else. I want to know where you actually are — not where you want to be.";
    if (step === 1) return 'And today, your energy is...';
    if (step === 2) return 'One more. If you could clear one patch of fog today, where would you look?';
    return '';
  };

  const getStepLabel = (): string => {
    if (step === 0) return 'Right now, you feel more like...';
    if (step === 1) return '';
    if (step === 2) return '';
    return '';
  };

  const handleComplete = async () => {
    if (!session?.user.id || !affect || !direction) return;

    setLoading(true);
    try {
      // Parse domain choices from scenarios
      let domainChoices: { domain: QuestDomain; weight: number }[] = [];
      try {
        domainChoices = JSON.parse(params.domains ?? '[]');
      } catch {}

      // Add First Light direction as a strong signal
      domainChoices.push({ domain: direction, weight: 3 });

      // Initialize archetype from all signals
      const archetypeState = initializeFromScenarios(domainChoices);

      // Determine archetype from primary
      const archetype = archetypeState.primary;

      // Update profile: set archetype, mark onboarding complete
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          archetype,
          archetype_assigned_at: new Date().toISOString(),
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Store First Light data as memory fact
      await supabase.from('user_memory_facts').insert({
        user_id: session.user.id,
        category: 'personal_fact',
        fact_text: `First Light: affect=${affect}, energy=${energy.toFixed(2)}, direction=${direction}`,
        source: 'onboarding',
        importance: 8,
      });

      await fetchProfile();

      // WP7: Ask Kael's permission question before navigating
      await new Promise<void>((resolve) => {
        Alert.alert(
          'One last thing',
          '"Can I remind you? Not every day — only when it feels right. I won\'t push. But sometimes, the fog lifts when you\'re nudged."',
          [
            {
              text: 'Yes, remind me',
              onPress: async () => {
                await requestNotificationPermission();
                await scheduleDailyReminder();
                resolve();
              },
            },
            {
              text: 'Not right now',
              style: 'cancel',
              onPress: () => resolve(),
            },
          ],
        );
      });

      // Navigate to main app
      router.replace('/(app)/(tabs)/quests');
    } catch (e) {
      console.error('first-light error:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  // Kael's message after placement
  const getCompletionMessage = (): string => {
    if (energy < 0.33) {
      return "And you placed it honestly. Most people pretend they're further along than they are. You didn't. That matters more than you think.";
    }
    if (energy > 0.66) {
      return "You've got fire today. Let's not waste it. But first — this is your ground truth. We come back to it.";
    }
    return "That's enough. Look. That's you. Not a goal. Not a plan. Just... where you are. Everything we do starts from what's real.";
  };

  return (
    <AtmosphericBackground variant="warm">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress dots */}
          <View style={styles.progress}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.dot, step >= i && styles.dotActive]}
              />
            ))}
          </View>

          {/* Kael intro */}
          <Text style={styles.kaelText}>{getKaelIntro()}</Text>

          {/* Step label */}
          {getStepLabel() ? (
            <Text style={styles.stepLabel}>{getStepLabel()}</Text>
          ) : null}

          {/* Step content */}
          <View style={styles.stepContent}>
            {step === 0 && (
              <AffectSelector selected={affect} onSelect={setAffect} />
            )}
            {step === 1 && (
              <EnergySlider value={energy} onValueChange={setEnergy} />
            )}
            {step === 2 && (
              <View style={styles.directionCards}>
                {DIRECTION_CARDS.map((card) => (
                  <GlowButton
                    key={card.domain}
                    title={`${card.emoji}  ${card.label}`}
                    variant={direction === card.domain ? 'primary' : 'secondary'}
                    onPress={() => setDirection(card.domain)}
                    style={styles.directionButton}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <GlowButton
            title={step === 2 ? 'Place Your Light' : 'Continue'}
            onPress={handleNext}
            disabled={!canContinue()}
            loading={loading}
          />
        </View>
      </SafeAreaView>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.muted,
    opacity: 0.2,
  },
  dotActive: {
    backgroundColor: colors.gold.DEFAULT,
    opacity: 1,
  },
  kaelText: {
    ...typography.body,
    fontSize: 18,
    lineHeight: 28,
    color: colors.gold.light,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stepLabel: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  directionCards: {
    gap: spacing.sm,
  },
  directionButton: {
    paddingVertical: spacing.md,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
