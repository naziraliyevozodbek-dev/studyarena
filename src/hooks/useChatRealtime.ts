import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore, Message, MessageReaction, MessageRead, PinnedMessage } from '@/store/chatStore';

export function useChatRealtime(roomId: string | null, token: string | null, currentUserId?: string) {
  const { 
    addMessage, 
    updateMessage, 
    deleteMessage, 
    addReaction, 
    removeReaction,
    addReadReceipt,
    addPinnedMessage,
    removePinnedMessage
  } = useChatStore();

  useEffect(() => {
    if (!roomId || !token) return;

    // Set the JWT token for Realtime so RLS policies pass
    supabase.realtime.setAuth(token);

    // We create a channel specifically for this room
    const channel = supabase.channel(`room:${roomId}`);

    const playNotificationSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {
        console.error('Audio play error', e);
      }
    };

    // Subscribe to messages
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
      async (payload) => {
        const newMsg = payload.new as Message;
        // We need to fetch the user details since the realtime payload only has sender_id
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, avatar_url, role')
          .eq('id', newMsg.sender_id)
          .single();
          
        if (userData) {
          newMsg.users = userData;
        }
        
        // Also fetch any attached files
        const { data: files } = await supabase
          .from('message_files')
          .select('*')
          .eq('message_id', newMsg.id);
          
        if (files && files.length > 0) {
          newMsg.message_files = files;
        }

        if (currentUserId && newMsg.sender_id !== currentUserId) {
          playNotificationSound();
        }

        addMessage(newMsg);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
      (payload) => {
        updateMessage(payload.new as Message);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
      (payload) => {
        deleteMessage(payload.old.id);
      }
    );

    // Subscribe to reactions
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'message_reactions' },
      (payload) => {
        addReaction(payload.new as MessageReaction);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'message_reactions' },
      (payload) => {
        removeReaction(payload.old.id, payload.old.message_id); // we need message_id, hopefully REPLICA IDENTITY FULL sends it
      }
    );

    // Subscribe to reads
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'message_reads' },
      (payload) => {
        addReadReceipt(payload.new as MessageRead);
      }
    );

    // Subscribe to pinned messages
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'pinned_messages', filter: `room_id=eq.${roomId}` },
      async (payload) => {
        const newPinned = payload.new as PinnedMessage;
        // Fetch the message content
        const { data: msgData } = await supabase
          .from('messages')
          .select('*, users!messages_sender_id_fkey(full_name, avatar_url, role)')
          .eq('id', newPinned.message_id)
          .single();
        if (msgData) newPinned.messages = msgData;
        addPinnedMessage(newPinned);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'pinned_messages', filter: `room_id=eq.${roomId}` },
      (payload) => {
        removePinnedMessage(payload.old.id);
      }
    );

    // Typing indicator
    channel.on(
      'broadcast',
      { event: 'typing' },
      (payload) => {
        if (payload.payload.userId && payload.payload.name) {
          useChatStore.getState().setTypingUser(payload.payload.userId, payload.payload.name);
        }
      }
    );

    channel.subscribe((status) => {
      console.log(`Realtime subscription status for room ${roomId}:`, status);
    });

    // Provide a way to send events if needed, but useEffect cleanup requires returning a function.
    // Instead of returning the channel, we'll store it in a module variable or use window.
    (window as any)._currentChatChannel = channel;

    return () => {
      supabase.removeChannel(channel);
      (window as any)._currentChatChannel = null;
    };
  }, [roomId, token, currentUserId, addMessage, updateMessage, deleteMessage, addReaction, removeReaction, addReadReceipt, addPinnedMessage, removePinnedMessage]);
}
