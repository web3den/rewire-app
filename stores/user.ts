import { Alert } from 'react-native';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { UserStats, UserCurrencies, QuestDomain, STAT_COLUMNS } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';

interface UserState {
  stats: UserStats | null;
  currencies: UserCurrencies | null;
  loading: boolean;

  fetchStats: () => Promise<void>;
  fetchCurrencies: () => Promise<void>;
  fetchAll: () => Promise<void>;
  updateStat: (domain: QuestDomain, amount: number) => Promise<void>;
  spendCurrency: (type: 'fragments' | 'energy' | 'fog_light', amount: number) => Promise<boolean>;
}

export const useUserStore = create<UserState>((set, get) => ({
  stats: null,
  currencies: null,
  loading: false,

  fetchStats: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      set({ stats: data as UserStats });
    } catch (e) {
      console.error('user/fetchStats:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  fetchCurrencies: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('user_currencies')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      set({ currencies: data as UserCurrencies });
    } catch (e) {
      console.error('user/fetchCurrencies:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  fetchAll: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });
      const [statsRes, currRes] = await Promise.all([
        supabase.from('user_stats').select('*').eq('user_id', userId).single(),
        supabase.from('user_currencies').select('*').eq('user_id', userId).single(),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (currRes.error) throw currRes.error;

      set({
        stats: statsRes.data as UserStats,
        currencies: currRes.data as UserCurrencies,
      });
    } catch (e) {
      console.error('user/fetchAll:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  updateStat: async (domain: QuestDomain, amount: number) => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      // Ensure stats are loaded
      if (!get().stats) {
        await get().fetchStats();
      }

      const stats = get().stats;
      if (!stats) throw new Error('Stats not loaded');

      const column = STAT_COLUMNS[domain];
      const currentValue = stats[column] as number;
      const newValue = Math.min(100, Math.max(0, currentValue + amount));

      const { error } = await supabase
        .from('user_stats')
        .update({ [column]: newValue, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      set({
        stats: {
          ...stats,
          [column]: newValue,
          updated_at: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error('user/updateStat:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  spendCurrency: async (type: 'fragments' | 'energy' | 'fog_light', amount: number) => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return false;

    try {
      set({ loading: true });

      const currencies = get().currencies;
      if (!currencies) throw new Error('Currencies not loaded');

      const currentBalance = currencies[type];
      if (currentBalance < amount) {
        return false;
      }

      const newBalance = currentBalance - amount;

      const { error } = await supabase
        .from('user_currencies')
        .update({ [type]: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      set({
        currencies: {
          ...currencies,
          [type]: newBalance,
          updated_at: new Date().toISOString(),
        },
      });

      return true;
    } catch (e) {
      console.error('user/spendCurrency:', e);
      Alert.alert('Something went wrong', 'Please try again.');
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
