import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Search } from 'lucide-react';

interface AddFriendDialogProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

const AddFriendDialog = ({ userId, open, onClose }: AddFriendDialogProps) => {
  const [friendName, setFriendName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddFriend = async () => {
    if (!friendName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid name.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: friendProfile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${friendName.trim()}%`)
        .single();

      if (!friendProfile) {
        toast({
          title: 'User not found',
          description: 'No user found with that name.',
          variant: 'destructive',
        });
        return;
      }

      if (friendProfile.id === userId) {
        toast({
          title: 'Error',
          description: 'You cannot add yourself as a friend.',
          variant: 'destructive',
        });
        return;
      }

      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id, sender_id, receiver_id, status')
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${friendProfile.id}),` +
            `and(sender_id.eq.${friendProfile.id},receiver_id.eq.${userId})`
        )
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          const isSentByMe = existingRequest.sender_id === userId;
          toast({
            title: isSentByMe ? 'Request already sent' : 'Request already received',
            description: isSentByMe
              ? 'You have already sent a friend request to this user.'
              : 'This user has already sent you a friend request. Please check your Requests tab.',
          });
          return;
        }

        // Delete old non-pending request and insert new one
        const { error: deleteError } = await supabase
          .from('friend_requests')
          .delete()
          .eq('id', existingRequest.id);

        if (deleteError) throw deleteError;
      }

      const { error } = await supabase.from('friend_requests').insert({
        sender_id: userId,
        receiver_id: friendProfile.id,
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Friend request sent successfully.',
      });

      setFriendName('');
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send friend request.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Search for friends by name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Friend's Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter friend's name"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
            />
          </div>

          <Button onClick={handleAddFriend} disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Friend Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendDialog;
