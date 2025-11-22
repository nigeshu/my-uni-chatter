import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const renderMessageContent = (content: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
            >
              {part}
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface ChatWindowProps {
  userId: string;
  friendId: string;
}

const ChatWindow = ({ userId, friendId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState<Profile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (userId && friendId) {
      fetchFriend();
      fetchMessages();
      markMessagesAsRead();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [userId, friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const subscribeToMessages = () => {
    const channelName = `chat-${[userId, friendId].sort().join('-')}`;
    const channel = supabase.channel(channelName);

    // Subscribe to new messages
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${friendId},receiver_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          markMessagesAsRead();
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId === friendId) {
          setIsTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchFriend = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', friendId).single();

    if (data) setFriend(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const markMessagesAsRead = async () => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', userId)
      .eq('is_read', false);
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Broadcast typing status
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping: value.length > 0 },
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, isTyping: false },
          });
        }
      }, 2000);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Stop typing indicator
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping: false },
      });
    }

    const message = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: friendId,
      content: message,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
      setNewMessage(message);
    }
  };

  return (
    <>
      {/* Chat Header */}
      <div className="h-16 border-b border-border flex items-center px-6 bg-card">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {friend?.full_name?.[0] || friend?.email?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <p className="font-semibold">{friend?.full_name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{friend?.email}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isSent = message.sender_id === userId;
            return (
              <div
                key={message.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isSent
                      ? 'bg-chat-sent text-primary-foreground'
                      : 'bg-chat-received text-foreground'
                  }`}
                >
                  <p className="break-words">{renderMessageContent(message.content)}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-chat-received rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border p-4 bg-card">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
};

export default ChatWindow;
