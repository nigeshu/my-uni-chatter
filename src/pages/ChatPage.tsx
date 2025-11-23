import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import FriendsList from '@/components/FriendsList';
import ChatWindow from '@/components/ChatWindow';
import AddFriendDialog from '@/components/AddFriendDialog';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageSquare } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

const ChatPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) setProfile(data);
  };

  return (
    <div className="h-full flex animate-fade-in">
      {/* Friends Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Let's Talk</h2>
          </div>

          <Button onClick={() => setShowAddFriend(true)} className="w-full bg-gradient-primary hover:opacity-90" size="lg">
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
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
            <div className="text-center space-y-4 p-8">
              <div className="p-8 bg-gradient-primary rounded-full inline-block shadow-xl">
                <MessageSquare className="h-20 w-20 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Start a Conversation
                </h2>
                <p className="text-muted-foreground text-lg">
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

export default ChatPage;
