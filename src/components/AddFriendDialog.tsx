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
import { UserPlus, Copy, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddFriendDialogProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

const AddFriendDialog = ({ userId, open, onClose }: AddFriendDialogProps) => {
  const [friendEmail, setFriendEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const shareableLink = `${window.location.origin}/friend-invite/${userId}`;

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: friendProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', friendEmail.trim())
        .single();

      if (!friendProfile) {
        toast({
          title: 'User not found',
          description: 'No user found with that email address.',
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
        .select('id')
        .eq('sender_id', userId)
        .eq('receiver_id', friendProfile.id)
        .single();

      if (existingRequest) {
        toast({
          title: 'Request already sent',
          description: 'You have already sent a friend request to this user.',
        });
        return;
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

      setFriendEmail('');
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

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({
      title: 'Link copied!',
      description: 'Share this link with your friends.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Search for friends by email or share your friend link
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="search">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="share">
              <UserPlus className="h-4 w-4 mr-2" />
              Share Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Friend's Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              />
            </div>

            <Button onClick={handleAddFriend} disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Friend Request'}
            </Button>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <div className="space-y-2">
              <Label>Your Friend Link</Label>
              <div className="flex gap-2">
                <Input value={shareableLink} readOnly className="flex-1" />
                <Button onClick={copyLink} size="icon" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with friends. When they click it and sign up, you'll both be
                connected!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendDialog;
