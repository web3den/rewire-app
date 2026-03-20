import { Alert } from 'react-native';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ConversationMessage } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';

interface GuideState {
  sessionId: string | null;
  messages: ConversationMessage[];
  loading: boolean;
  energyUsed: number;
  maxEnergy: number;

  startSession: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useGuideStore = create<GuideState>((set, get) => ({
  sessionId: null,
  messages: [],
  loading: false,
  energyUsed: 0,
  maxEnergy: 10,

  startSession: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      const { data, error } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: userId,
          register: 'mythic',
          energy_spent: 0,
          crisis_override: false,
        })
        .select()
        .single();

      if (error) throw error;

      set({ sessionId: data.id, messages: [], energyUsed: 0 });
    } catch (e) {
      console.error('guide/startSession:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (content: string) => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    const { sessionId } = get();
    if (!sessionId) return;

    // 1. Optimistically add user message to local state
    const optimisticUserMsg: ConversationMessage = {
      id: `temp-user-${Date.now()}`,
      session_id: sessionId,
      user_id: userId,
      role: 'user',
      content,
      crisis_level: 'normal',
      created_at: new Date().toISOString(),
    };

    set((state) => ({ messages: [...state.messages, optimisticUserMsg] }));

    try {
      set({ loading: true });

      // 2. Persist user message to conversation_messages
      const { data: savedUserMsg, error: userMsgError } = await supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          role: 'user',
          content,
          crisis_level: 'normal',
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Replace optimistic message with persisted one
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === optimisticUserMsg.id ? (savedUserMsg as ConversationMessage) : m,
        ),
      }));

      // 3. Call guide-chat edge function
      const { data, error: fnError } = await supabase.functions.invoke('guide-chat', {
        body: { session_id: sessionId, message: content },
      });

      if (fnError) throw fnError;

      // 4. Add guide response to local state
      // Edge function returns { data: { guide_response, crisis_level, ... } }
      const responseData = data?.data ?? data ?? {};
      const guideResponse = responseData.guide_response ?? responseData.response ?? '';
      const guideCrisisLevel = responseData.crisis_level ?? 'normal';

      const guideMsg: ConversationMessage = {
        id: data?.message_id ?? `guide-${Date.now()}`,
        session_id: sessionId,
        user_id: userId,
        role: 'guide',
        content: guideResponse,
        crisis_level: guideCrisisLevel,
        created_at: new Date().toISOString(),
      };

      set((state) => ({ messages: [...state.messages, guideMsg] }));

      // 5. Persist guide message to conversation_messages
      await supabase.from('conversation_messages').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'guide',
        content: guideResponse,
        crisis_level: guideCrisisLevel,
      });

      // 6. Increment energyUsed
      set((state) => ({ energyUsed: state.energyUsed + 1 }));
    } catch (e) {
      console.error('guide/sendMessage:', e);

      // Show Kael fallback message
      const fallbackMsg: ConversationMessage = {
        id: `fallback-${Date.now()}`,
        session_id: sessionId,
        user_id: userId,
        role: 'guide',
        content:
          "The fog thickens... I'm having trouble connecting. Try again in a moment.",
        crisis_level: 'normal',
        created_at: new Date().toISOString(),
      };

      set((state) => ({ messages: [...state.messages, fallbackMsg] }));
    } finally {
      set({ loading: false });
    }
  },

  loadSession: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      // Fetch the most recent conversation session with no ended_at
      const { data: session, error: sessionError } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;

      if (!session) {
        // No active session found
        set({ sessionId: null, messages: [] });
        return;
      }

      set({ sessionId: session.id, energyUsed: session.energy_spent ?? 0 });

      // Fetch messages for this session
      const { data: messages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      set({ messages: (messages ?? []) as ConversationMessage[] });
    } catch (e) {
      console.error('guide/loadSession:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },
}));
