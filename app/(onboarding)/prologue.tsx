import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { GlowButton } from '@/components/GlowButton';
import { colors, spacing, typography } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PageData {
  id: string;
  heading: string;
  body: string;
  variant: 'default' | 'warm' | 'deep';
}

const PAGES: PageData[] = [
  {
    id: 'p1',
    heading: 'You\'ve been here before...',
    body: 'Not this place exactly. But this feeling—of standing at the edge of something, fog stretching out before you.',
    variant: 'deep',
  },
  {
    id: 'p2',
    heading: 'This world exists between...',
    body: '...who you are and who you\'re becoming. The fog isn\'t emptiness—it\'s possibility, waiting to take shape.',
    variant: 'warm',
  },
  {
    id: 'p3',
    heading: 'I\'m Kael.',
    body: 'I\'ve walked these paths before. I can\'t walk them for you—but I can walk beside you.',
    variant: 'default',
  },
];

export default function Prologue() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const flatListRef = useRef<FlatList<PageData>>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentPage(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleContinue = (): void => {
    if (currentPage < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
    } else {
      router.push('/(onboarding)/scenarios');
    }
  };

  return (
    <AtmosphericBackground variant={PAGES[currentPage].variant}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          data={PAGES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
          style={styles.flatList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.page}>
              <Text style={styles.heading}>{item.heading}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {PAGES.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, currentPage === index && styles.dotActive]}
              />
            ))}
          </View>

          {currentPage === PAGES.length - 1 ? (
            <GlowButton
              title="Enter the Fog"
              onPress={() => router.push('/(onboarding)/scenarios')}
            />
          ) : (
            <GlowButton
              title="Continue"
              variant="ghost"
              onPress={handleContinue}
            />
          )}
        </View>
      </SafeAreaView>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  heading: {
    ...typography.title,
    textAlign: 'center',
    color: colors.gold.DEFAULT,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 28,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.muted,
    opacity: 0.3,
  },
  dotActive: {
    backgroundColor: colors.gold.DEFAULT,
    opacity: 1,
    width: 24,
  },
});
