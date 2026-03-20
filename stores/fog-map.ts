import { Alert } from 'react-native';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { FogMapTile } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';

interface FogMapState {
  tiles: FogMapTile[];
  loading: boolean;

  fetchTiles: () => Promise<void>;
  revealTile: (tileIndex: number, revealedBy: string, referenceId?: string) => Promise<void>;
}

export const useFogMapStore = create<FogMapState>((set, get) => ({
  tiles: [],
  loading: false,

  fetchTiles: async () => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      const { data, error } = await supabase
        .from('fog_map_state')
        .select('*')
        .eq('user_id', userId)
        .order('tile_index', { ascending: true });

      if (error) throw error;

      set({ tiles: (data ?? []) as FogMapTile[] });
    } catch (e) {
      console.error('fog-map/fetchTiles:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },

  revealTile: async (tileIndex: number, revealedBy: string, referenceId?: string) => {
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    try {
      set({ loading: true });

      const now = new Date().toISOString();

      const updatePayload: Partial<FogMapTile> = {
        status: 'revealed',
        revealed_at: now,
        revealed_by: revealedBy,
        updated_at: now,
      };

      if (referenceId !== undefined) {
        updatePayload.reference_id = referenceId;
      }

      const { error } = await supabase
        .from('fog_map_state')
        .update(updatePayload)
        .eq('user_id', userId)
        .eq('tile_index', tileIndex);

      if (error) throw error;

      // Update local state to reflect the reveal immediately
      set((state) => ({
        tiles: state.tiles.map((tile) =>
          tile.tile_index === tileIndex
            ? {
                ...tile,
                status: 'revealed',
                revealed_at: now,
                revealed_by: revealedBy,
                reference_id: referenceId ?? tile.reference_id,
                updated_at: now,
              }
            : tile,
        ),
      }));
    } catch (e) {
      console.error('fog-map/revealTile:', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      set({ loading: false });
    }
  },
}));
