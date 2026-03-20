import { Alert } from 'react-native';
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  initialized: boolean;
  loading: boolean;

  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initialized: false,
  loading: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session });

      if (session) {
        await get().fetchProfile();
      }

      supabase.auth.onAuthStateChange(async (event, newSession) => {
        set({ session: newSession });

        if (event === 'SIGNED_IN' && newSession) {
          await get().fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          set({ profile: null });
        }
      });
    } catch (e) {
      console.error('auth/initialize:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ initialized: true });
    }
  },

  fetchProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('auth/fetchProfile:', error);
        // Don't show alert — profile may not exist yet (onboarding)
      }
      set({ profile: data as UserProfile | null });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e) {
      console.error('auth/signIn:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { user: data.user };
    } catch (e) {
      console.error('auth/signUp:', e);
      Alert.alert('Something went wrong', 'Please try again.');
      return { user: null };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error('auth/signOut:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  setProfile: (profile: UserProfile) => set({ profile }),
}));
