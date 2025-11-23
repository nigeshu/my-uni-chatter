-- Allow users to delete their own friendships
CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);