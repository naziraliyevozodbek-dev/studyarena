import { useChatStore } from '@/store/chatStore';
import { Pin } from 'lucide-react';

export default function PinnedBanner() {
  const { pinnedMessages, activeRoomId } = useChatStore();

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  // Show the latest pinned message
  const latestPinned = pinnedMessages[0];
  const msgContent = latestPinned.messages?.content || 'Pinned message';

  return (
    <div className="bg-bg-card border-b border-border p-2 px-4 shadow-sm z-10 flex items-center gap-3 cursor-pointer hover:bg-bg-secondary transition-colors">
      <div className="text-primary opacity-80">
        <Pin size={20} className="fill-primary/20" />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="text-primary font-medium text-sm">
          Qadalgan xabar
        </div>
        <div className="text-text-secondary text-xs truncate">
          {msgContent}
        </div>
      </div>
    </div>
  );
}
