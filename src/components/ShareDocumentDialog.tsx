import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Check } from 'lucide-react';

interface Friend {
  id: string;
  email: string;
  full_name: string | null;
}

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  documentUrl: string;
}

const ShareDocumentDialog = ({
  open,
  onOpenChange,
  documentTitle,
  documentUrl,
}: ShareDocumentDialogProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchFriends();
      setSelectedFriends(new Set());
    }
  }, [open]);

  const fetchFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: friendshipsData } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id);

    if (friendshipsData && friendshipsData.length > 0) {
      const friendIds = friendshipsData.map((f) => f.friend_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (profiles) {
        setFriends(profiles);
      }
    }
  };

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleShare = async () => {
    if (selectedFriends.size === 0) {
      toast({
        title: 'No friends selected',
        description: 'Please select at least one friend to share with.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const shareMessage = `📄 Shared document: ${documentTitle}\n\n${documentUrl}`;

      const messages = Array.from(selectedFriends).map((friendId) => ({
        sender_id: user.id,
        receiver_id: friendId,
        content: shareMessage,
      }));

      const { error } = await supabase.from('messages').insert(messages);

      if (error) throw error;

      toast({
        title: 'Document shared!',
        description: `Shared with ${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to share document.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Share "{documentTitle}" with your friends
          </div>

          <ScrollArea className="h-[300px] border rounded-lg p-2">
            {friends.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No friends available</p>
                <p className="text-sm mt-1">Add friends to share documents</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      selectedFriends.has(friend.id)
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'hover:bg-muted border-2 border-transparent'
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
                    {selectedFriends.has(friend.id) && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-3">
            <Button
              onClick={handleShare}
              disabled={loading || selectedFriends.size === 0}
              className="flex-1 bg-gradient-accent hover:opacity-90"
            >
              {loading ? 'Sharing...' : `Share with ${selectedFriends.size} friend${selectedFriends.size !== 1 ? 's' : ''}`}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentDialog;
