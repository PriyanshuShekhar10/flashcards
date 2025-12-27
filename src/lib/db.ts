import { supabase } from './supabase';

// Helper functions to convert between SQLite integer timestamps and PostgreSQL timestamps
const toTimestamp = (date: Date | number | null): string | null => {
  if (!date) return null;
  if (typeof date === 'number') {
    // SQLite integer timestamp (seconds) -> PostgreSQL timestamp
    return new Date(date * 1000).toISOString();
  }
  return date instanceof Date ? date.toISOString() : null;
};

const fromTimestamp = (timestamp: string | null): number | null => {
  if (!timestamp) return null;
  // PostgreSQL timestamp -> SQLite integer timestamp (seconds)
  return Math.floor(new Date(timestamp).getTime() / 1000);
};

// Type definitions to match the original SQLite interface
export interface Folder {
  id: number;
  name: string;
  createdAt: number;
}

export interface Flashcard {
  id: number;
  imageUrl: string;
  thumbUrl: string | null;
  notes: string;
  folderId: number | null;
  starred: number;
  lastVisited: number | null;
  createdAt: number;
}

// Folder operations
export const folders = {
  create: async (name: string): Promise<Folder> => {
    const { data, error } = await supabase
      .from('folders')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    return {
      id: data.id,
      name: data.name,
      createdAt: fromTimestamp(data.createdAt) || Date.now(),
    };
  },

  getAll: async (): Promise<Folder[]> => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching folders:', error);
      // Convert Supabase error to Error object for better error handling
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    return (data || []).map((folder) => ({
      id: folder.id,
      name: folder.name,
      createdAt: fromTimestamp(folder.createdAt) || Date.now(),
    }));
  },

  getById: async (id: number): Promise<Folder | undefined> => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return undefined;
      }
      console.error('Error fetching folder:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    if (!data) return undefined;

    return {
      id: data.id,
      name: data.name,
      createdAt: fromTimestamp(data.createdAt) || Date.now(),
    };
  },

  update: async (id: number, name: string): Promise<void> => {
    const { error } = await supabase
      .from('folders')
      .update({ name })
      .eq('id', id);

    if (error) {
      console.error('Error updating folder:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting folder:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }
  },
};

// Flashcard operations
export const flashcards = {
  create: async (
    imageUrl: string,
    notes: string = '',
    folderId: number | null = null,
    thumbUrl?: string
  ): Promise<Flashcard> => {
    const { data, error } = await supabase
      .from('flashcards')
      .insert([
        {
          imageUrl,
          thumbUrl: thumbUrl || null,
          notes,
          folderId,
          starred: 0,
          lastVisited: null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating flashcard:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    return {
      id: data.id,
      imageUrl: data.imageUrl,
      thumbUrl: data.thumbUrl,
      notes: data.notes,
      folderId: data.folderId,
      starred: data.starred,
      lastVisited: fromTimestamp(data.lastVisited),
      createdAt: fromTimestamp(data.createdAt) || Date.now(),
    };
  },

  getAll: async (
    folderId?: number | null,
    starred?: boolean,
    dateFilter?: string | null
  ): Promise<Flashcard[]> => {
    let query = supabase.from('flashcards').select('*');

    // Handle folderId filter
    if (folderId !== null && folderId !== undefined) {
      query = query.eq('folderId', folderId);
    }

    // Handle starred filter
    if (starred === true) {
      query = query.eq('starred', 1);
    }

    // Handle date filter
    if (dateFilter) {
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('lastVisited', startOfDay.toISOString())
        .lte('lastVisited', endOfDay.toISOString());
    }

    query = query.order('createdAt', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching flashcards:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    return (data || []).map((card) => ({
      id: card.id,
      imageUrl: card.imageUrl,
      thumbUrl: card.thumbUrl,
      notes: card.notes,
      folderId: card.folderId,
      starred: card.starred,
      lastVisited: fromTimestamp(card.lastVisited),
      createdAt: fromTimestamp(card.createdAt) || Date.now(),
    }));
  },

  getById: async (id: number): Promise<Flashcard | undefined> => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return undefined;
      }
      console.error('Error fetching flashcard:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    if (!data) return undefined;

    return {
      id: data.id,
      imageUrl: data.imageUrl,
      thumbUrl: data.thumbUrl,
      notes: data.notes,
      folderId: data.folderId,
      starred: data.starred,
      lastVisited: fromTimestamp(data.lastVisited),
      createdAt: fromTimestamp(data.createdAt) || Date.now(),
    };
  },

  update: async (
    id: number,
    updates: {
      notes?: string;
      folderId?: number | null;
      starred?: number;
      lastVisited?: number;
    }
  ): Promise<void> => {
    const updateData: any = {};

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }
    if (updates.folderId !== undefined) {
      updateData.folderId = updates.folderId;
    }
    if (updates.starred !== undefined) {
      updateData.starred = updates.starred;
    }
    if (updates.lastVisited !== undefined) {
      updateData.lastVisited = toTimestamp(updates.lastVisited);
    }

    const { error } = await supabase
      .from('flashcards')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating flashcard:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }
  },

  toggleStar: async (id: number): Promise<Flashcard | null> => {
    const card = await flashcards.getById(id);
    if (!card) return null;

    const newStarred = card.starred === 1 ? 0 : 1;

    const { error } = await supabase
      .from('flashcards')
      .update({ starred: newStarred })
      .eq('id', id);

    if (error) {
      console.error('Error toggling star:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    const updatedCard = await flashcards.getById(id);
    return updatedCard || null;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting flashcard:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }
  },

  getVisitedDates: async (): Promise<Array<{ date: string }>> => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('lastVisited')
      .not('lastVisited', 'is', null);

    if (error) {
      console.error('Error fetching visited dates:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    // Extract unique dates from timestamps
    const dateSet = new Set<string>();
    (data || []).forEach((card) => {
      if (card.lastVisited) {
        const date = new Date(card.lastVisited).toISOString().split('T')[0];
        dateSet.add(date);
      }
    });

    return Array.from(dateSet)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({ date }));
  },

  count: async (folderId?: number | null): Promise<number> => {
    let query = supabase.from('flashcards').select('id', { count: 'exact', head: true });

    if (folderId !== null && folderId !== undefined) {
      query = query.eq('folderId', folderId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting flashcards:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(errorMessage);
    }

    return count || 0;
  },
};

// Keep compatibility with old initDatabase function (no-op for Supabase)
export function initDatabase() {
  // Schema initialization is handled by Supabase SQL editor
  // This function is kept for compatibility
}
