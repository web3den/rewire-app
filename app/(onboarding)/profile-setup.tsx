import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { GlowButton } from '@/components/GlowButton';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ domains: string; track: string; checkIn: string }>();
  const { session, setProfile, fetchProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 20);
    return d;
  });
  const [loading, setLoading] = useState(false);

  // Max date = 16 years ago
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 16);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    if (dateOfBirth > maxDate) {
      Alert.alert('Age requirement', 'You must be at least 16 years old.');
      return;
    }
    if (!session?.user.id) {
      Alert.alert('Something went wrong', 'Please try signing in again.');
      return;
    }

    setLoading(true);
    try {
      const dobString = dateOfBirth.toISOString().split('T')[0];

      // Insert profile — trigger will auto-create stats, currencies, fog map, season
      const { error } = await supabase.from('user_profiles').insert({
        id: session.user.id,
        display_name: displayName.trim(),
        date_of_birth: dobString,
        is_minor: false,
        onboarding_completed: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (error) {
        // Profile might already exist (retry scenario), try update
        if (error.code === '23505') {
          await supabase
            .from('user_profiles')
            .update({
              display_name: displayName.trim(),
              date_of_birth: dobString,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
            .eq('id', session.user.id);
        } else {
          throw error;
        }
      }

      await fetchProfile();

      // Navigate to First Light
      router.push({
        pathname: '/(onboarding)/first-light',
        params: {
          domains: params.domains ?? '[]',
          track: params.track ?? 'A',
          checkIn: params.checkIn ?? 'doing_alright',
        },
      });
    } catch (e) {
      console.error('profile-setup error:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AtmosphericBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <Text style={styles.title}>One more thing</Text>
              <Text style={styles.subtitle}>
                Just your name and when you arrived in the world.
              </Text>

              <View style={styles.form}>
                <View>
                  <Text style={styles.label}>What should I call you?</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={colors.text.muted}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoComplete="name"
                    textContentType="name"
                    maxLength={50}
                    returnKeyType="done"
                  />
                </View>

                <View>
                  <Text style={styles.label}>Date of birth</Text>
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={dateOfBirth}
                      mode="date"
                      display="spinner"
                      maximumDate={maxDate}
                      minimumDate={new Date(1930, 0, 1)}
                      onChange={(_, date) => {
                        if (date) setDateOfBirth(date);
                      }}
                      themeVariant="dark"
                      textColor={colors.text.primary}
                      style={styles.picker}
                    />
                  </View>
                </View>
              </View>

              <GlowButton
                title="Complete Setup"
                onPress={handleSubmit}
                loading={loading}
                disabled={!displayName.trim()}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
  },
  content: {
    flex: 1,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
    color: colors.text.secondary,
  },
  input: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerContainer: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    height: 150,
  },
});
