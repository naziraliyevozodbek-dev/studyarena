import { Message, useChatStore } from '@/store/chatStore';
import { useAuth } from '@/context/AuthContext';
import { Check, CheckCheck, Edit2, Trash2, Reply, SmilePlus, Pin, FileText, Download } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MessageItemProps {
  msg: Message;
  isSelected: boolean;
  onSelect: () => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
}

export const EMOJIS = ['👍', '❤️', '🔥', '👏', '😄', '😢'];

export default function MessageItem({ msg, isSelected, onSelect, onReply, onEdit }: MessageItemProps) {
  const { user, token } = useAuth();
  const isMine = msg.sender_id === user?.id;
  const isMentor = msg.users?.role === 'mentor';
  const isMeMentor = user?.role === 'mentor';

  const [showReactions, setShowReactions] = useState(false);

  const handleDelete = async () => {
    // Determine delete type if we want, but for now just call API to delete for everyone
    try {
      await fetch(`/api/chat/${msg.room_id}?messageId=${msg.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReact = async (emoji: string) => {
    setShowReactions(false);
    if (!user) return;
    
    // Check if I already reacted with this emoji
    const existing = msg.message_reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
    
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: msg.id,
        user_id: user.id,
        emoji
      });
    }
  };

  const handlePin = async () => {
    if (!user) return;
    try {
      await supabase.from('pinned_messages').insert({
        room_id: msg.room_id,
        message_id: msg.id,
        pinned_by: user.id
      });
    } catch (e) {
      console.error('Failed to pin:', e);
    }
  };

  // Group reactions
  const reactionCounts: Record<string, { count: number, me: boolean }> = {};
  msg.message_reactions?.forEach(r => {
    if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, me: false };
    reactionCounts[r.emoji].count++;
    if (r.user_id === user?.id) reactionCounts[r.emoji].me = true;
  });

  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
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
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={`relative rounded-2xl px-3 py-2 cursor-pointer transition-colors ${
            isMine 
              ? 'bg-primary text-white rounded-br-sm hover:bg-primary/90' 
              : 'bg-bg-card border border-border text-text-main rounded-bl-sm'
          } ${isSelected ? 'ring-2 ring-primary/50' : ''}`}
        >
          {msg.reply_to_message_id && msg.reply_to_message && (
            <div className={`mb-1 px-2 py-1 border-l-2 rounded text-sm ${isMine ? 'border-white/50 bg-black/10' : 'border-primary/50 bg-primary/5'}`}>
              <div className="font-semibold text-xs opacity-80">{msg.reply_to_message.users?.full_name || 'Xabar'}</div>
              <div className="truncate opacity-90">{msg.reply_to_message.content || 'Fayl'}</div>
            </div>
          )}

          {/* Media & Files Render */}
          {msg.message_files && msg.message_files.length > 0 && (
            <div className="flex flex-col gap-2 mb-1">
              {msg.message_files.map(file => {
                const isImage = file.file_type.startsWith('image/');
                const isAudio = file.file_type.startsWith('audio/');
                
                if (isImage) {
                  return <img key={file.id} src={file.file_url} alt="" className="rounded-lg max-w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(file.file_url, '_blank')} />;
                }
                
                if (isAudio) {
                  return (
                    <div key={file.id} className="min-w-[200px]">
                      <audio controls src={file.file_url} className="w-full h-8" />
                    </div>
                  );
                }

                return (
                  <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-lg ${isMine ? 'bg-black/10' : 'bg-bg-secondary'} hover:opacity-80 transition-opacity`}>
                    <div className={`p-2 rounded-full ${isMine ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                      <FileText size={20} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium truncate">{file.file_name}</span>
                      <span className="text-[10px] opacity-70">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Download size={16} className="ml-auto opacity-70" />
                  </a>
                );
              })}
            </div>
          )}

          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
          
          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? 'justify-end text-white/70' : 'justify-end text-text-tertiary'}`}>
            {msg.is_edited && <span>(tahrirlangan)</span>}
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isMine && (
              <span className="ml-1">
                {(msg.message_reads?.length || 0) > 0 ? <CheckCheck size={12} /> : <Check size={12} />}
              </span>
            )}
          </div>
        </div>

        {/* Reactions Render */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactionCounts).map(([emoji, data]) => (
              <button 
                key={emoji}
                onClick={() => handleReact(emoji)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border ${
                  data.me ? 'bg-primary/10 border-primary text-primary' : 'bg-bg-card border-border text-text-main'
                }`}
              >
                <span>{emoji}</span>
                <span className="font-medium">{data.count}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Actions Menu */}
        {isSelected && (
          <div className={`absolute top-full mt-1 z-20 flex bg-bg-card border border-border shadow-lg rounded-xl overflow-hidden p-1 ${isMine ? 'right-0' : 'left-0'}`}>
            <button onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }} className="p-2 hover:bg-bg-secondary rounded-lg text-text-secondary transition-colors" title="Reaksiya">
              <SmilePlus size={18} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onReply(msg); }} className="p-2 hover:bg-bg-secondary rounded-lg text-text-secondary transition-colors" title="Javob qaytarish">
              <Reply size={18} />
            </button>
            {isMeMentor && (
              <button onClick={(e) => { e.stopPropagation(); handlePin(); }} className="p-2 hover:bg-bg-secondary rounded-lg text-text-secondary transition-colors" title="Qadab qo'yish">
                <Pin size={18} />
              </button>
            )}
            {isMine && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(msg); }} className="p-2 hover:bg-bg-secondary rounded-lg text-text-secondary transition-colors" title="Tahrirlash">
                <Edit2 size={18} />
              </button>
            )}
            {isMine && (
              <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors" title="O'chirish">
                <Trash2 size={18} />
              </button>
            )}

            {/* Reactions Picker popout */}
            {showReactions && (
              <div className="absolute top-full mt-2 bg-bg-card border border-border shadow-xl rounded-full p-2 flex gap-1 z-30">
                {EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => handleReact(emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-bg-secondary rounded-full text-xl transition-transform hover:scale-110">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
