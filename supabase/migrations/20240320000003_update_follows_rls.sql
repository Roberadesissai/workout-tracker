-- Temporarily disable RLS for debugging
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their follow relationships" ON follows;
DROP POLICY IF EXISTS "Users can view all follows" ON follows;
DROP POLICY IF EXISTS "Users can create follow requests" ON follows;
DROP POLICY IF EXISTS "Users can create their own follows" ON follows;
DROP POLICY IF EXISTS "Users can manage received follow requests" ON follows;
DROP POLICY IF EXISTS "Users can update their own follows" ON follows;
DROP POLICY IF EXISTS "Users can delete their follow relationships" ON follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON follows;

-- Create new policies
DO $$ 
BEGIN
  -- SELECT policy
  CREATE POLICY "Users can view their follow relationships"
  ON follows FOR SELECT
  USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id
  );

  -- INSERT policy
  CREATE POLICY "Users can create follow requests"
  ON follows FOR INSERT
  WITH CHECK (
    auth.uid() = follower_id AND
    follower_id != following_id
  );

  -- UPDATE policy for accepting/rejecting follow requests
  CREATE POLICY "Users can manage received follow requests"
  ON follows FOR UPDATE
  USING (
    -- Only the person being followed can update requests
    auth.uid() = following_id
  )
  WITH CHECK (
    -- Can only update their own received requests
    auth.uid() = following_id AND
    -- Only pending requests can be updated
    status = 'pending'
  );

  -- DELETE policy
  CREATE POLICY "Users can delete their follow relationships"
  ON follows FOR DELETE
  USING (
    -- Either the follower or the person being followed can delete the relationship
    auth.uid() IN (follower_id, following_id)
  );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$; 