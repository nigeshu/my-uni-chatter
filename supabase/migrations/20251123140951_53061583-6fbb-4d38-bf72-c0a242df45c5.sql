-- Add RLS policy to allow users to delete their messages
CREATE POLICY "Users can delete their messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);