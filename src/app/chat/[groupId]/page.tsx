'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Send, X } from 'lucide-react';
import { useChatStore, Message } from '@/store/chatStore';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import MessageItem from '@/components/chat/MessageItem';

export default function ChatRoom({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params);
  const { user, token } = useAuth();
  const router = useRouter();
  
  const { 
    messages, 
    setMessages, 
    addMessage, 
    activeRoomId, 
    setActiveRoom, 
    deleteMessage 
  } = useChatStore();

  useChatRealtime(activeRoomId, token);

  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [groupName, setGroupName] = useState('Guruh Chati');
  const [memberCount, setMemberCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${resolvedParams.groupId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        
        if (data.roomId) setActiveRoom(data.roomId);
        setMessages(data.messages || []);
        if (data.courseName) setGroupName(data.courseName);
        if (data.memberCount) setMemberCount(data.memberCount);
        
        // Only scroll to bottom on initial load or if user is near bottom
        if (loading) setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user, token, resolvedParams.groupId, router, loading, setActiveRoom, setMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const currentInput = inputValue.trim();
    setInputValue('');
    setSending(true);

    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      sender_id: user?.id || '',
      room_id: activeRoomId || '',
      content: currentInput,
      created_at: new Date().toISOString(),
      reply_to_message_id: replyTo?.id || null,
      reply_to_message: replyTo || undefined,
      is_edited: false,
      deleted_for_users: [],
      users: { full_name: user?.full_name, avatar_url: user?.avatar_url, role: user?.role }
    } as Message;
    
    addMessage(optimisticMsg);
    setReplyTo(null);
    setEditingMsg(null);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await fetch(`/api/chat/${resolvedParams.groupId}`, {
        method: editingMsg ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          content: currentInput, 
          reply_to_message_id: replyTo?.id,
          messageId: editingMsg?.id 
        })
      });
      
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      
      // We don't necessarily need to replace it manually since Realtime will push the INSERT event.
      // But we should remove the temp message and let realtime handle the real one, 
      // or we just replace the temp one to avoid flicker.
      deleteMessage(optimisticMsg.id);
      addMessage(data.message);
    } catch (error) {
      console.error(error);
      deleteMessage(optimisticMsg.id);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Optimistic delete
    deleteMessage(messageId);
    setSelectedMessage(null);
    
    try {
      const res = await fetch(`/api/chat/${resolvedParams.groupId}?messageId=${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete');
    } catch (error) {
      console.error(error);
      // We'd ideally revert if failed, but for simplicity we rely on refresh or ignoring it here
      alert('Xabarni o\'chirishda xatolik yuz berdi');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-bg-card border-b border-border z-10 shrink-0 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="mr-3 text-text-secondary hover:text-text-main transition-colors p-1"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <div className="font-bold text-text-main leading-tight line-clamp-1">{groupName}</div>
            <div className="text-xs text-text-tertiary">{memberCount ? `${memberCount} a'zo` : '...'} • {messages.length} xabar</div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-bg-base"
        onClick={() => setSelectedMessage(null)}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
            Hali xabarlar yo'q. Birinchi bo'lib yozing!
          </div>
        ) : (
          messages.map(msg => (
            <MessageItem 
              key={msg.id} 
              msg={msg} 
              isSelected={selectedMessage === msg.id}
              onSelect={() => setSelectedMessage(selectedMessage === msg.id ? null : msg.id)}
              onReply={(m) => { setReplyTo(m); setSelectedMessage(null); setEditingMsg(null); }}
              onEdit={(m) => { setEditingMsg(m); setInputValue(m.content); setReplyTo(null); setSelectedMessage(null); }}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-bg-card border-t border-border shrink-0 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {(replyTo || editingMsg) && (
          <div className="px-4 py-2 border-b border-border bg-bg-base/50 flex items-center justify-between">
            <div className="text-sm">
              <div className="text-primary font-medium flex items-center gap-2">
                {editingMsg ? <Edit2 size={14}/> : <Reply size={14}/>}
                {editingMsg ? 'Xabarni tahrirlash' : `Javob: ${replyTo?.users?.full_name || 'Xabar'}`}
              </div>
              <div className="text-text-tertiary truncate max-w-[250px] text-xs">
                {editingMsg ? editingMsg.content : replyTo?.content}
              </div>
            </div>
            <button 
              onClick={() => { setReplyTo(null); setEditingMsg(null); setInputValue(''); }}
              className="p-1 rounded-full hover:bg-bg-secondary text-text-secondary"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-3">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 bg-bg-secondary rounded-2xl border border-border overflow-hidden focus-within:border-primary/50 transition-colors shadow-sm">
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Xabar yozish..."
              className="w-full bg-transparent border-none text-text-main p-3 max-h-32 min-h-[44px] resize-none focus:outline-none focus:ring-0 text-[15px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          <button 
            type="submit" 
            disabled={!inputValue.trim() || sending}
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              inputValue.trim() && !sending ? 'bg-primary text-white' : 'bg-bg-secondary text-text-tertiary cursor-not-allowed'
            }`}
          >
            <Send size={20} className={inputValue.trim() && !sending ? 'ml-1' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
}
