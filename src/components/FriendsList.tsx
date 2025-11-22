import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface Friend extends Profile {
  unreadCount?: number;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  status: string;
  sender: Profile;
}

interface FriendsListProps {
  userId: string;
  selectedFriend: string | null;
  onSelectFriend: (friendId: string) => void;
}

const FriendsList = ({ userId, selectedFriend, onSelectFriend }: FriendsListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchFriends();
      fetchRequests();
      subscribeToChanges();
    }
  }, [userId]);

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => fetchFriends()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
        },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchFriends = async () => {
    const { data: friendshipsData } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId);

    if (friendshipsData && friendshipsData.length > 0) {
      const friendIds = friendshipsData.map((f) => f.friend_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (profiles) {
        const friendsWithUnread = await Promise.all(
          profiles.map(async (profile) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('sender_id', profile.id)
              .eq('receiver_id', userId)
              .eq('is_read', false);

            return { ...profile, unreadCount: count || 0 };
          })
        );

        setFriends(friendsWithUnread);
      }
    } else {
      setFriends([]);
    }
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        status,
        sender:profiles!friend_requests_sender_id_fkey(*)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (data) {
      setRequests(data as any);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      toast({
        title: 'Error',
        description: 'Failed to accept friend request.',
        variant: 'destructive',
      });
      return;
    }

    await supabase.from('friendships').insert([
      { user_id: userId, friend_id: senderId },
      { user_id: senderId, friend_id: userId },
    ]);

    toast({
      title: 'Success',
      description: 'Friend request accepted!',
    });

    fetchRequests();
    fetchFriends();
  };

  const handleRejectRequest = async (requestId: string) => {
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);

    toast({
      title: 'Request rejected',
      description: 'Friend request has been rejected.',
    });

    fetchRequests();
  };

  return (
    <Tabs defaultValue="friends" className="h-full flex flex-col">
      <TabsList className="mx-4 mt-2">
        <TabsTrigger value="friends" className="flex-1">
          <Users className="h-4 w-4 mr-2" />
          Friends
          {friends.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {friends.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="requests" className="flex-1">
          Requests
          {requests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {requests.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="friends" className="flex-1 m-0 overflow-hidden">
        <ScrollArea className="h-full">
          {friends.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No friends yet</p>
              <p className="text-sm mt-1">Add friends to start chatting</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => onSelectFriend(friend.id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedFriend === friend.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-chat-hover'
                  }`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {friend.full_name?.[0] || friend.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{friend.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                  </div>
                  {friend.unreadCount! > 0 && (
                    <Badge variant="default" className="rounded-full">
                      {friend.unreadCount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="requests" className="flex-1 m-0 overflow-hidden">
        <ScrollArea className="h-full">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {request.sender.full_name?.[0] || request.sender.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{request.sender.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{request.sender.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id, request.sender_id)}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
};

export default FriendsList;
