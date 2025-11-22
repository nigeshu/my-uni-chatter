-- Create a function to automatically create reciprocal friendships
CREATE OR REPLACE FUNCTION public.create_reciprocal_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the reciprocal friendship if it doesn't exist
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (NEW.friend_id, NEW.user_id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create reciprocal friendships
DROP TRIGGER IF EXISTS create_reciprocal_friendship_trigger ON public.friendships;
CREATE TRIGGER create_reciprocal_friendship_trigger
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.create_reciprocal_friendship();