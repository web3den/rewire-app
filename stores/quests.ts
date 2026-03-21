import { Alert } from 'react-native';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Quest, QuestAssignment, QuestDomain, CompleteQuestWP6Response } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { maybeFireStreakMilestone } from '@/lib/notifications';

interface QuestState {
  anchor: QuestAssignment | null;
  choice: QuestAssignment | null;
  ember: QuestAssignment | null;
  choiceOptions: Quest[];
  loading: boolean;
  refreshesUsed: number;
  networkError: string | null;

  // Last completion result from WP6 edge function
  lastCompletionResult: CompleteQuestWP6Response | null;

  // WP5: per-domain skip counts (resets at midnight, in-memory only)
  skipCountsByDomain: Partial<Record<QuestDomain, number>>;
  // Domains blocked by anti-cherry-pick rule (3 skips → forced away)
  blockedDomains: QuestDomain[];

  fetchDailyQuests: () => Promise<void>;
  skipQuest: (assignmentId: string, domain: QuestDomain) => Promise<void>;
  completeQuest: (
    assignmentId: string,
    questId: string,
    domain: QuestDomain,
    reflection?: string,
  ) => Promise<CompleteQuestWP6Response | null>;
  refreshChoiceQuests: () => Promise<void>;
  autoAssignDailyQuests: (userId: string, today: string) => Promise<void>;
  selectChoiceQuest: (questId: string) => Promise<void>;
  clearNetworkError: () => void;
}

function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useQuestsStore = create<QuestState>((set, get) => ({
  anchor: null,
  choice: null,
  ember: null,
  choiceOptions: [],
  loading: false,
  refreshesUsed: 0,
  networkError: null,
  lastCompletionResult: null,
  skipCountsByDomain: {},
  blockedDomains: [],

  clearNetworkError: () => set({ networkError: null }),

  fetchDailyQuests: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      const today = getTodayDateString();

      const { data, error } = await supabase
        .from('quest_assignments')
        .select('*, quest:quests(*)')
        .eq('user_id', userId)
        .eq('assigned_date', today);

      if (error) throw error;

      const assignments = (data ?? []) as QuestAssignment[];
      let anchor: QuestAssignment | null = null;
      let choice: QuestAssignment | null = null;
      let ember: QuestAssignment | null = null;

      for (const assignment of assignments) {
        if (assignment.slot_type === 'anchor') anchor = assignment;
        else if (assignment.slot_type === 'choice') choice = assignment;
        else if (assignment.slot_type === 'ember') ember = assignment;
      }

      // Fetch choice options if the choice assignment has a choice_options array
      let choiceOptions: Quest[] = [];
      if (choice && Array.isArray(choice.choice_options) && choice.choice_options.length > 0) {
        const { data: optionQuests, error: optError } = await supabase
          .from('quests')
          .select('*')
          .in('id', choice.choice_options);

        if (optError) throw optError;
        choiceOptions = (optionQuests ?? []) as Quest[];
      }

      // If no assignments for today, call generate-daily-quests edge function
      if (!anchor && !choice && !ember) {
        const { error: genError } = await supabase.functions.invoke('generate-daily-quests', {
          body: { user_id: userId },
        });
        if (genError) {
          console.error('quests/generateDailyQuests:', genError);
          // Fallback to local assignment
          await get().autoAssignDailyQuests(userId, today);
        }

        // Re-fetch after generation
        const { data: newData } = await supabase
          .from('quest_assignments')
          .select('*, quest:quests(*)')
          .eq('user_id', userId)
          .eq('assigned_date', today);

        for (const a of (newData ?? []) as QuestAssignment[]) {
          if (a.slot_type === 'anchor') anchor = a;
          else if (a.slot_type === 'choice') choice = a;
          else if (a.slot_type === 'ember') ember = a;
        }

        if (choice && Array.isArray(choice.choice_options) && choice.choice_options.length > 0) {
          const { data: optQ } = await supabase
            .from('quests')
            .select('*')
            .in('id', choice.choice_options);
          choiceOptions = (optQ ?? []) as Quest[];
        }
      }

      set({ anchor, choice, ember, choiceOptions, networkError: null });
    } catch (e: unknown) {
      console.error('quests/fetchDailyQuests:', e);
      const msg = e instanceof Error ? e.message : 'Network error';
      set({ networkError: msg });
    } finally {
      set({ loading: false });
    }
  },

  // ── WP5: Skip Quest ──────────────────────────────────────────────────────
  skipQuest: async (assignmentId: string, domain: QuestDomain) => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      // Mark assignment as skipped in DB (no rewards, no penalty)
      const { error } = await supabase
        .from('quest_assignments')
        .update({ status: 'skipped', updated_at: new Date().toISOString() })
        .eq('id', assignmentId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log skip to quest_choice_history for anti-cherry-pick enforcement
      await supabase.from('quest_choice_history').insert({
        user_id: userId,
        assignment_id: assignmentId,
        action: 'skipped',
        domain,
        skipped_at: new Date().toISOString(),
      }).then(({ error: histErr }) => {
        if (histErr) console.warn('quests/skipHistory:', histErr.message);
      });

      // ── Anti-cherry-pick counter ──────────────────────────────────────
      const { skipCountsByDomain } = get();
      const currentCount = skipCountsByDomain[domain] ?? 0;
      const newCount = currentCount + 1;
      const updatedCounts = { ...skipCountsByDomain, [domain]: newCount };

      // After 3 skips in the same domain, add it to blocked list
      let { blockedDomains } = get();
      if (newCount >= 3 && !blockedDomains.includes(domain)) {
        blockedDomains = [...blockedDomains, domain];
      }

      set({ skipCountsByDomain: updatedCounts, blockedDomains });

      // Refetch to update board (skipped quest will show as skipped)
      await get().fetchDailyQuests();
    } catch (e) {
      console.error('quests/skipQuest:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  completeQuest: async (
    assignmentId: string,
    _questId: string,
    _domain: QuestDomain,
    reflection?: string,
  ): Promise<CompleteQuestWP6Response | null> => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return null;

    try {
      set({ loading: true, networkError: null });

      // Call WP6 edge function — it handles all DB writes, stat gains, spark awards
      const { data, error } = await supabase.functions.invoke<CompleteQuestWP6Response>(
        'complete-quest-wp6',
        {
          body: {
            user_id: userId,
            assignment_id: assignmentId,
            completion_type: reflection ? 'reflection' : 'self_report',
            reflection_text: reflection ?? undefined,
          },
        },
      );

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Quest completion failed');

      // Update local sparks balance immediately
      if (data.sparks_balance !== undefined) {
        useUserStore.getState().setSparksBalance(data.sparks_balance);
      }

      set({ lastCompletionResult: data });

      // WP7: fire streak milestone notification if applicable
      if (data.streak_days) {
        maybeFireStreakMilestone(data.streak_days);
      }

      // Refetch quests + user data to sync state
      await Promise.all([get().fetchDailyQuests(), useUserStore.getState().fetchAll()]);

      return data;
    } catch (e: unknown) {
      console.error('quests/completeQuest:', e);
      const msg = e instanceof Error ? e.message : 'Network error';
      set({ networkError: msg });
      Alert.alert('Could not complete quest', msg + '\n\nPlease try again.');
      return null;
    } finally {
      set({ loading: false });
    }
  },

  autoAssignDailyQuests: async (userId: string, today: string) => {
    try {
      // Pick random quests for each slot from the seed pool
      const domains: QuestDomain[] = ['body', 'mind', 'heart', 'courage', 'order', 'spirit'];

      // Anchor: random ember quest
      const { data: anchorQuests } = await supabase
        .from('quests')
        .select('id')
        .eq('tier', 'ember')
        .limit(10);

      if (anchorQuests && anchorQuests.length > 0) {
        const anchorQuest = anchorQuests[Math.floor(Math.random() * anchorQuests.length)];
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        await supabase.from('quest_assignments').insert({
          user_id: userId,
          quest_id: anchorQuest.id,
          slot_type: 'anchor',
          status: 'active',
          assigned_date: today,
          expires_at: endOfDay.toISOString(),
        });
      }

      // Choice: pick 3 random quests from different domains
      const { data: choicePool } = await supabase
        .from('quests')
        .select('id')
        .eq('tier', 'ember')
        .limit(20);

      if (choicePool && choicePool.length >= 3) {
        const shuffled = choicePool.sort(() => Math.random() - 0.5);
        const choiceIds = shuffled.slice(0, 3).map((q) => q.id);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        await supabase.from('quest_assignments').insert({
          user_id: userId,
          quest_id: choiceIds[0],
          slot_type: 'choice',
          status: 'active',
          assigned_date: today,
          expires_at: endOfDay.toISOString(),
          choice_options: choiceIds,
        });
      }

      // Ember: random quick quest
      const { data: emberQuests } = await supabase
        .from('quests')
        .select('id')
        .eq('tier', 'ember')
        .limit(10);

      if (emberQuests && emberQuests.length > 0) {
        const emberQuest = emberQuests[Math.floor(Math.random() * emberQuests.length)];
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        await supabase.from('quest_assignments').insert({
          user_id: userId,
          quest_id: emberQuest.id,
          slot_type: 'ember',
          status: 'active',
          assigned_date: today,
          expires_at: endOfDay.toISOString(),
        });
      }
    } catch (e) {
      console.error('quests/autoAssign:', e);
    }
  },

  refreshChoiceQuests: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      // Check spark balance before invoking (cost: 1 spark after first free refresh)
      const sparks = useUserStore.getState().sparks;
      const refreshesUsed = get().refreshesUsed;
      if (refreshesUsed > 0 && (sparks?.sparks ?? 0) < 1) {
        Alert.alert('Not enough Sparks', 'You need 1 Spark to refresh your options.');
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke('refresh-choice-quests', {
        body: { user_id: userId },
      });

      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error ?? 'Refresh failed');
      }

      // Update spark balance if cost was applied
      if (data?.sparks_available !== undefined) {
        useUserStore.getState().setSparksBalance(data.sparks_available);
      }

      set((state) => ({ refreshesUsed: state.refreshesUsed + 1 }));
      await get().fetchDailyQuests();
    } catch (e: unknown) {
      console.error('quests/refreshChoiceQuests:', e);
      const msg = e instanceof Error ? e.message : 'Network error';
      Alert.alert('Could not refresh quests', msg);
    } finally {
      set({ loading: false });
    }
  },

  selectChoiceQuest: async (questId: string) => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      const { choice } = get();
      if (!choice) throw new Error('No choice assignment found');

      const { error } = await supabase
        .from('quest_assignments')
        .update({ quest_id: questId, updated_at: new Date().toISOString() })
        .eq('id', choice.id)
        .eq('user_id', userId);

      if (error) throw error;

      await get().fetchDailyQuests();
    } catch (e) {
      console.error('quests/selectChoiceQuest:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },
}));
