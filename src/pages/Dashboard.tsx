import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, UserPlus, LogOut, Send, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import FriendsList from '@/components/FriendsList';
import ChatWindow from '@/components/ChatWindow';
import AddFriendDialog from '@/components/AddFriendDialog';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) setProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Let's Talk</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{profile?.full_name || 'User'}</p>
              <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-border">
          <Button onClick={() => setShowAddFriend(true)} className="w-full" variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friend
          </Button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-hidden">
          <FriendsList
            userId={user?.id || ''}
            selectedFriend={selectedFriend}
            onSelectFriend={setSelectedFriend}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <ChatWindow userId={user?.id || ''} friendId={selectedFriend} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center space-y-4">
              <div className="p-6 bg-muted rounded-full inline-block">
                <MessageSquare className="h-16 w-16 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to Let's Talk</h2>
                <p className="text-muted-foreground">
                  Select a friend to start chatting or add new friends to connect
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddFriend && (
        <AddFriendDialog
          userId={user?.id || ''}
          open={showAddFriend}
          onClose={() => setShowAddFriend(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
