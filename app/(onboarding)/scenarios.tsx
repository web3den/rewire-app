import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { ScenarioCard } from '@/components/ScenarioCard';
import { GlowButton } from '@/components/GlowButton';
import { colors, spacing, typography } from '@/lib/theme';
import type { QuestDomain, Scenario, CheckInResponse } from '@/lib/types';

// ─── Redesigned scenarios from FIRST-WEEK-EXPERIENCE-DESIGN.md ───

const SCENARIOS: Scenario[] = [
  {
    id: 'saturday',
    title: 'The Saturday',
    narration:
      'You wake up with nothing planned. No obligations. The whole day is yours. What pulls at you first?',
    choices: [
      { emoji: '🏃', text: 'I want to move — go somewhere, feel something physical.', domain: 'body' },
      { emoji: '🧩', text: "There's something I've been wanting to figure out.", domain: 'mind' },
      { emoji: '📱', text: 'I think about who I could reach out to.', domain: 'heart' },
      { emoji: '⚡', text: "I've been putting something off. Today I could face it.", domain: 'courage' },
      { emoji: '🧹', text: 'My space is a mess. I want to get things in order.', domain: 'order' },
      { emoji: '🌙', text: 'I just want to sit with the quiet for a while.', domain: 'spirit' },
    ],
  },
  {
    id: 'conversation',
    title: 'The Conversation',
    narration:
      "A friend tells you something vulnerable — they're struggling. You notice your instinct. What is it?",
    choices: [
      { emoji: '🔍', text: 'I want to fix it. My mind is already looking for solutions.', domain: 'mind' },
      { emoji: '💪', text: 'I feel it in my body — tension, energy, a need to do something.', domain: 'body' },
      { emoji: '🤝', text: 'I just want them to feel heard. I lean in.', domain: 'heart' },
      { emoji: '💬', text: 'I want to say the honest thing, even if it\'s hard.', domain: 'courage' },
      { emoji: '📋', text: 'I start thinking about what they could organize or change.', domain: 'order' },
      { emoji: '🌊', text: 'I feel something deeper stir — like their pain connects to something universal.', domain: 'spirit' },
    ],
  },
  {
    id: 'setback',
    title: 'The Setback',
    narration:
      'Something you were counting on falls through — a plan, a job, a relationship. In the first ten seconds, before you think about it, what happens?',
    choices: [
      { emoji: '😤', text: 'My body reacts first — chest tight, jaw clenched, need to move.', domain: 'body' },
      { emoji: '🧠', text: "My mind starts analyzing — what went wrong, what's the pattern.", domain: 'mind' },
      { emoji: '💔', text: 'I feel the loss of connection more than anything.', domain: 'heart' },
      { emoji: '🔥', text: "Something in me gets defiant — 'fine, watch me.'", domain: 'courage' },
      { emoji: '📝', text: 'I start making a new plan almost immediately.', domain: 'order' },
      { emoji: '🕊️', text: 'I go still. I feel the weight of it and try to let it be.', domain: 'spirit' },
    ],
  },
];

const CHECK_IN_OPTIONS: { label: string; value: CheckInResponse }[] = [
  { label: "I'm doing alright. I want to grow.", value: 'doing_alright' },
  { label: "I'm managing, but something needs to change.", value: 'managing_needs_change' },
  { label: "Honestly, I'm having a hard time.", value: 'having_hard_time' },
  { label: "I'm just trying to get through the day.", value: 'just_getting_through' },
];

// Scenario 4 (adaptive, simpler)
const CHOICE_SCENARIO: Scenario = {
  id: 'choice',
  title: 'The Choice',
  narration:
    "Two paths. One is familiar and safe — you know you'll be okay. One is unknown — it could be better or worse, but you'd learn something about yourself. No one is watching.",
  choices: [
    { emoji: '🛤️', text: 'The familiar path. I need steady ground right now.', domain: 'order' },
    { emoji: '🌀', text: 'The unknown path. I need to shake something loose.', domain: 'courage' },
    { emoji: '⏸️', text: "I'd stand there for a while, honestly.", domain: 'mind' },
  ],
};

export default function ScenariosScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Steps: 0=Saturday, 1=Conversation, 2=CheckIn, 3=Setback, 4=Choice
  const [selections, setSelections] = useState<(number | null)[]>([null, null, null, null]);
  const [checkInResponse, setCheckInResponse] = useState<CheckInResponse | null>(null);

  const totalSteps = 5;
  const isCheckIn = step === 2;
  const scenarioForStep = (): Scenario | null => {
    if (step === 0) return SCENARIOS[0];
    if (step === 1) return SCENARIOS[1];
    if (step === 3) return SCENARIOS[2];
    if (step === 4) return CHOICE_SCENARIO;
    return null;
  };

  const canContinue = (): boolean => {
    if (isCheckIn) return checkInResponse !== null;
    const scenario = scenarioForStep();
    if (!scenario) return false;
    const selIndex = step > 2 ? step - 1 : step;
    return selections[selIndex] !== null;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Collect domain choices
      const domainChoices: { domain: QuestDomain; weight: number }[] = [];
      const allScenarios = [SCENARIOS[0], SCENARIOS[1], SCENARIOS[2], CHOICE_SCENARIO];
      const selIndexes = [selections[0], selections[1], selections[2], selections[3]];

      allScenarios.forEach((scenario, i) => {
        const selIdx = selIndexes[i];
        if (selIdx !== null && scenario.choices[selIdx]) {
          domainChoices.push({ domain: scenario.choices[selIdx].domain, weight: 2 });
        }
      });

      // Store in global state (we'll pass via params)
      const track: 'A' | 'B' =
        checkInResponse === 'doing_alright' || checkInResponse === 'managing_needs_change'
          ? 'A'
          : 'B';

      router.push({
        pathname: '/(onboarding)/profile-setup',
        params: {
          domains: JSON.stringify(domainChoices),
          track,
          checkIn: checkInResponse ?? 'doing_alright',
        },
      });
    }
  };

  const handleSelect = (index: number) => {
    const selIndex = step > 2 ? step - 1 : step;
    const newSelections = [...selections];
    newSelections[selIndex] = index;
    setSelections(newSelections);
  };

  const scenario = scenarioForStep();
  const selIndex = step > 2 ? step - 1 : step;

  return (
    <AtmosphericBackground variant="warm">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progress}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[styles.progressDot, i <= step && styles.progressDotActive]}
              />
            ))}
          </View>

          {isCheckIn ? (
            <View style={styles.checkIn}>
              <Text style={styles.kaelSays}>
                Before we continue — right now, today, how are things?
              </Text>

              <View style={styles.checkInOptions}>
                {CHECK_IN_OPTIONS.map((opt) => (
                  <GlowButton
                    key={opt.value}
                    title={opt.label}
                    variant={checkInResponse === opt.value ? 'primary' : 'secondary'}
                    onPress={() => setCheckInResponse(opt.value)}
                    style={styles.checkInButton}
                  />
                ))}
              </View>
            </View>
          ) : scenario ? (
            <>
              <Text style={styles.kaelLabel}>Kael</Text>
              <ScenarioCard
                narration={scenario.narration}
                choices={scenario.choices}
                selectedIndex={selections[selIndex]}
                onSelect={handleSelect}
              />
            </>
          ) : null}
        </ScrollView>

        <View style={styles.bottom}>
          <GlowButton
            title={step === totalSteps - 1 ? 'Continue' : 'Next'}
            onPress={handleNext}
            disabled={!canContinue()}
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
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.muted,
    opacity: 0.2,
  },
  progressDotActive: {
    backgroundColor: colors.gold.DEFAULT,
    opacity: 1,
  },
  kaelLabel: {
    fontSize: 13,
    color: colors.gold.dim,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  checkIn: {
    paddingHorizontal: spacing.lg,
  },
  kaelSays: {
    ...typography.body,
    fontSize: 19,
    lineHeight: 30,
    color: colors.gold.light,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  checkInOptions: {
    gap: spacing.sm,
  },
  checkInButton: {
    paddingVertical: spacing.md,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
