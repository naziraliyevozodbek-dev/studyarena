import { create } from 'zustand';

interface AppState {
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  decrementUnread: () => void;
  incrementUnread: () => void;
}

export const useStore = create<AppState>((set) => ({
  unreadNotifications: 0,
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  decrementUnread: () => set((state) => ({ unreadNotifications: Math.max(0, state.unreadNotifications - 1) })),
  incrementUnread: () => set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),
}));
