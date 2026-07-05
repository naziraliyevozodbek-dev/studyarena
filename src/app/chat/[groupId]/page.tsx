'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Send, Trash2, MoreVertical, Users } from 'lucide-react';

export default function ChatRoom({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params);
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [groupName, setGroupName] = useState('Guruh Chati');
  const [memberCount, setMemberCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  
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

    // Simple polling for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [user, token, resolvedParams.groupId, router, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const currentInput = inputValue.trim();
    setInputValue('');
    setSending(true);

    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      sender_id: user?.id,
      course_id: resolvedParams.groupId,
      content: currentInput,
      created_at: new Date().toISOString(),
      users: { full_name: user?.full_name, avatar_url: user?.avatar_url, role: user?.role }
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await fetch(`/api/chat/${resolvedParams.groupId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ content: currentInput })
      });
      
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Optimistic delete
    const previousMessages = [...messages];
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setSelectedMessage(null);
    
    try {
      const res = await fetch(`/api/chat/${resolvedParams.groupId}?messageId=${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete');
    } catch (error) {
      console.error(error);
      // Revert if failed
      setMessages(previousMessages);
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
          messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            const isMentor = msg.users?.role === 'mentor';
            const isSelected = selectedMessage === msg.id;
            
            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {!isMine && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-bg-secondary mr-2 shrink-0 flex items-center justify-center self-end mb-1">
                    {msg.users?.avatar_url ? (
                      <img src={msg.users.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-text-secondary">
                        {msg.users?.full_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                )}
                
                <div className={`relative max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && (
                    <span className="text-[11px] text-text-tertiary ml-1 mb-1 font-medium flex items-center gap-1">
                      {msg.users?.full_name || 'Foydalanuvchi'}
                      {isMentor && <span className="bg-primary/10 text-primary px-1 rounded text-[9px] uppercase">Mentor</span>}
                    </span>
                  )}
                  
                  <div 
                    onClick={(e) => { e.stopPropagation(); isMine && setSelectedMessage(isSelected ? null : msg.id); }}
                    className={`relative rounded-2xl px-4 py-2 cursor-pointer transition-colors ${
                      isMine 
                        ? 'bg-primary text-white rounded-br-sm hover:bg-primary/90' 
                        : 'bg-bg-card border border-border text-text-main rounded-bl-sm'
                    } ${isSelected ? 'ring-2 ring-error/50' : ''}`}
                  >
                    <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                    <div className={`text-[10px] mt-1 flex items-center ${isMine ? 'justify-end text-white/70' : 'justify-end text-text-tertiary'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {/* Delete Option Popover */}
                  {isSelected && isMine && (
                    <div className="absolute top-full right-0 mt-1 z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                        className="flex items-center gap-2 bg-bg-card border border-border shadow-lg rounded-xl px-3 py-2 text-error text-sm font-medium hover:bg-error/10 transition-colors"
                      >
                        <Trash2 size={16} /> O'chirish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-bg-card border-t border-border shrink-0 pb-[calc(12px+env(safe-area-inset-bottom))]">
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
