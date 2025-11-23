-- Allow users to delete their own friend requests
CREATE POLICY "Users can delete their friend requests"
ON public.friend_requests
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);