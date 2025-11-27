-- Drop existing Let's Talk tables and related objects
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.friend_requests CASCADE;

-- Create friend_requests table
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS Policies for friendships
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create trigger for reciprocal friendships
CREATE OR REPLACE FUNCTION public.create_reciprocal_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (NEW.friend_id, NEW.user_id)
  ON CONFLICT (user_id, friend_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friendship_created
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.create_reciprocal_friendship();

-- Create trigger for updated_at on friend_requests
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id) WHERE status = 'pending';
CREATE INDEX idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX idx_friendships_user ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX idx_messages_receiver_unread ON public.messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;