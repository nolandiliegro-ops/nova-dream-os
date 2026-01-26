-- Drop the old delete policy that blocks default segments
DROP POLICY IF EXISTS "Users can delete non-default segments" ON public.segments;

-- Create new delete policy: allow deleting any segment except "other"
CREATE POLICY "Users can delete own segments except other" ON public.segments
  FOR DELETE USING (auth.uid() = user_id AND slug != 'other');