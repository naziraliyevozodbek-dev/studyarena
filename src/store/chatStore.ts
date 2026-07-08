import { create } from 'zustand';

export interface User {
  id?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface MessageFile {
  id: string;
  message_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  reply_to_message_id: string | null;
  is_edited: boolean;
  deleted_for_users: string[];
  users?: User;
  message_reactions?: MessageReaction[];
  message_reads?: MessageRead[];
  message_files?: MessageFile[];
  reply_to_message?: Partial<Message>; // For UI preview
}

export interface PinnedMessage {
  id: string;
  room_id: string;
  message_id: string;
  pinned_by: string;
  created_at: string;
  messages?: Message; // The actual message joined
}

interface ChatState {
  messages: Message[];
  pinnedMessages: PinnedMessage[];
  activeRoomId: string | null;
  isLoading: boolean;
  
  // Actions
  setActiveRoom: (roomId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setMessages: (messages: Message[]) => void;
  setPinnedMessages: (pinned: PinnedMessage[]) => void;
  
  // Optimistic/Realtime Updates
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => void;
  
  addReaction: (reaction: MessageReaction) => void;
  removeReaction: (reactionId: string, messageId: string) => void;
  
  addReadReceipt: (read: MessageRead) => void;
  addPinnedMessage: (pinned: PinnedMessage) => void;
  removePinnedMessage: (pinnedId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  pinnedMessages: [],
  activeRoomId: null,
  isLoading: true,

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  setMessages: (messages) => set({ messages }),
  setPinnedMessages: (pinnedMessages) => set({ pinnedMessages }),
  
  addMessage: (message) => set((state) => {
    // Prevent duplicates
    if (state.messages.some(m => m.id === message.id)) return state;
    return { messages: [...state.messages, message] };
  }),
  
  updateMessage: (updatedMsg) => set((state) => ({
    messages: state.messages.map((m) => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)
  })),
  
  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== messageId)
  })),

  addReaction: (reaction) => set((state) => ({
    messages: state.messages.map((m) => {
      if (m.id === reaction.message_id) {
        const existing = m.message_reactions || [];
        // Prevent duplicate reactions from same user
        if (existing.some(r => r.id === reaction.id)) return m;
        return { ...m, message_reactions: [...existing, reaction] };
      }
      return m;
    })
  })),

  removeReaction: (reactionId, messageId) => set((state) => ({
    messages: state.messages.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          message_reactions: (m.message_reactions || []).filter(r => r.id !== reactionId)
        };
      }
      return m;
    })
  })),

  addReadReceipt: (read) => set((state) => ({
    messages: state.messages.map((m) => {
      if (m.id === read.message_id) {
        const existing = m.message_reads || [];
        if (existing.some(r => r.user_id === read.user_id)) return m;
        return { ...m, message_reads: [...existing, read] };
      }
      return m;
    })
  })),

  addPinnedMessage: (pinned) => 
    set((state) => ({ pinnedMessages: [...state.pinnedMessages, pinned] })),
  
  removePinnedMessage: (pinnedId) =>
    set((state) => ({ pinnedMessages: state.pinnedMessages.filter(p => p.id !== pinnedId) }))
}));
