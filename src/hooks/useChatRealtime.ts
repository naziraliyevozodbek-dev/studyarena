import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore, Message, MessageReaction, MessageRead } from '@/store/chatStore';

export function useChatRealtime(roomId: string | null, token: string | null) {
  const { 
    addMessage, 
    updateMessage, 
    deleteMessage, 
    addReaction, 
    removeReaction,
    addReadReceipt 
  } = useChatStore();

  useEffect(() => {
    if (!roomId || !token) return;

    // Set the JWT token for Realtime so RLS policies pass
    supabase.realtime.setAuth(token);

    // We create a channel specifically for this room
    const channel = supabase.channel(`room:${roomId}`);

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

    channel.subscribe((status) => {
      console.log(`Realtime subscription status for room ${roomId}:`, status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, addMessage, updateMessage, deleteMessage, addReaction, removeReaction, addReadReceipt]);
}
