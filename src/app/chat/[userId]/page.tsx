'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ChatRoom({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
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
        const res = await fetch(`/api/chat/${resolvedParams.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
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
  }, [user, token, resolvedParams.userId, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const currentInput = inputValue.trim();
    setInputValue('');
    setSending(true);

    // Optimistic UI update
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      sender_id: user?.id,
      receiver_id: resolvedParams.userId,
      content: currentInput,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await fetch(`/api/chat/${resolvedParams.userId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ content: currentInput })
      });
      
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      
      // Replace optimistic message with actual
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));
    } catch (error) {
      console.error(error);
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
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
    <div className="flex flex-col h-[100dvh] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-bg-card border-b border-border z-10">
        <button 
          onClick={() => router.back()} 
          className="mr-3 text-text-secondary hover:text-text-main transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="font-bold text-text-main">Suhbatdosh</div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-bg-base">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
            Hali xabarlar yo'q. Birinchi bo'lib yozing!
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMine 
                      ? 'bg-primary text-white rounded-br-sm' 
                      : 'bg-bg-card border border-border text-text-main rounded-bl-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                  <span className={`text-[10px] block text-right mt-1 ${isMine ? 'text-white/70' : 'text-text-tertiary'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-bg-card border-t border-border mt-auto">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 bg-bg-secondary rounded-2xl border border-border overflow-hidden focus-within:border-primary/50 transition-colors">
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
