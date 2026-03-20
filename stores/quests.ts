import { Alert } from 'react-native';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Quest, QuestAssignment, QuestDomain } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';

interface QuestState {
  anchor: QuestAssignment | null;
  choice: QuestAssignment | null;
  ember: QuestAssignment | null;
  choiceOptions: Quest[];
  loading: boolean;
  refreshesUsed: number;

  fetchDailyQuests: () => Promise<void>;
  completeQuest: (
    assignmentId: string,
    questId: string,
    domain: QuestDomain,
    reflection?: string,
  ) => Promise<void>;
  refreshChoiceQuests: () => Promise<void>;
  autoAssignDailyQuests: (userId: string, today: string) => Promise<void>;
  selectChoiceQuest: (questId: string) => Promise<void>;
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

      // If no assignments for today, auto-assign from seed quests
      if (!anchor && !choice && !ember) {
        await get().autoAssignDailyQuests(userId, today);
        // Re-fetch after assignment
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

      set({ anchor, choice, ember, choiceOptions });
    } catch (e) {
      console.error('quests/fetchDailyQuests:', e);
    } finally {
      set({ loading: false });
    }
  },

  completeQuest: async (
    assignmentId: string,
    questId: string,
    domain: QuestDomain,
    reflection?: string,
  ) => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      // Determine rewards from the relevant assignment's joined quest
      const { anchor, choice, ember } = get();
      const allAssignments = [anchor, choice, ember].filter(Boolean) as QuestAssignment[];
      const assignment = allAssignments.find((a) => a.id === assignmentId);
      const fragmentsEarned = assignment?.quest?.reward_fragments ?? 10;
      const energyEarned = assignment?.quest?.reward_energy ?? 0;
      const fogRevealEarned = assignment?.quest?.reward_fog_reveal ?? 0;

      // Insert completion record
      const { error: completionError } = await supabase.from('quest_completions').insert({
        user_id: userId,
        quest_id: questId,
        assignment_id: assignmentId,
        completion_type: reflection ? 'reflection' : 'self_report',
        completed_at: new Date().toISOString(),
        reflection_text: reflection ?? null,
        fragments_earned: fragmentsEarned,
        energy_earned: energyEarned,
        fog_reveal_earned: fogRevealEarned,
        stat_dimension: domain,
        stat_change: 5,
        bonus_applied: {},
      });

      if (completionError) throw completionError;

      // Mark assignment as completed
      const { error: assignmentError } = await supabase
        .from('quest_assignments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', assignmentId);

      if (assignmentError) throw assignmentError;

      // Fetch current currencies and award rewards
      const { data: currencyData, error: currencyFetchError } = await supabase
        .from('user_currencies')
        .select('fragments, energy, fog_light')
        .eq('user_id', userId)
        .single();

      if (currencyFetchError) throw currencyFetchError;

      const { error: currencyUpdateError } = await supabase
        .from('user_currencies')
        .update({
          fragments: (currencyData.fragments ?? 0) + fragmentsEarned,
          energy: (currencyData.energy ?? 0) + energyEarned,
          fog_light: (currencyData.fog_light ?? 0) + fogRevealEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (currencyUpdateError) throw currencyUpdateError;

      // Refetch to sync state
      await get().fetchDailyQuests();
    } catch (e) {
      console.error('quests/completeQuest:', e);
      Alert.alert('Something went wrong', 'Please try again.');
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

      const { error } = await supabase.functions.invoke('get-daily-quests', {
        body: { user_id: userId, refresh_choice: true },
      });

      if (error) throw error;

      set((state) => ({ refreshesUsed: state.refreshesUsed + 1 }));
      await get().fetchDailyQuests();
    } catch (e) {
      console.error('quests/refreshChoiceQuests:', e);
      Alert.alert('Something went wrong', 'Please try again.');
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
