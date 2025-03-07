-- Create achievements table first
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    goal INTEGER,
    badge_url TEXT
);

-- Add RLS policies for achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select_own" 
ON achievements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "achievements_insert_own"
ON achievements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "achievements_update_own"
ON achievements FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "achievements_delete_own"
ON achievements FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    workout_id UUID,
    achievement_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workout_logs(id) ON DELETE SET NULL,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE SET NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Add RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own messages
CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Policy to allow users to read messages they're involved in
CREATE POLICY "Users can read messages they're involved in"
ON messages FOR SELECT
TO authenticated
USING (auth.uid() IN (sender_id, recipient_id));

-- Policy to allow users to update messages they sent
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);

-- Policy to allow users to delete messages they sent
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add online status and last seen to profiles table if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE; 