-- Create nutrition_progress table
CREATE TABLE nutrition_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,2),
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fats INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create food_database table
CREATE TABLE food_database (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  serving_size VARCHAR(100) NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,2) NOT NULL,
  carbs DECIMAL(5,2) NOT NULL,
  fats DECIMAL(5,2) NOT NULL,
  fiber DECIMAL(5,2),
  vitamins JSONB DEFAULT '{}',
  minerals JSONB DEFAULT '{}',
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nutrition_logs table for daily food intake
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES food_database(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL, -- breakfast, lunch, dinner, snack
  servings DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_nutrition_progress_user_date ON nutrition_progress(user_id, date);
CREATE INDEX idx_food_database_name ON food_database(name);
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_nutrition_progress_updated_at
  BEFORE UPDATE ON nutrition_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_database_updated_at
  BEFORE UPDATE ON food_database
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_logs_updated_at
  BEFORE UPDATE ON nutrition_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE nutrition_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Nutrition progress policies
CREATE POLICY "Users can view their own nutrition progress"
  ON nutrition_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition progress"
  ON nutrition_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition progress"
  ON nutrition_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition progress"
  ON nutrition_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Food database policies
CREATE POLICY "Anyone can view public food database entries"
  ON food_database FOR SELECT
  USING (is_custom = false OR auth.uid() = user_id);

CREATE POLICY "Users can insert custom food entries"
  ON food_database FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their custom food entries"
  ON food_database FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their custom food entries"
  ON food_database FOR DELETE
  USING (auth.uid() = user_id);

-- Nutrition logs policies
CREATE POLICY "Users can view their own nutrition logs"
  ON nutrition_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs"
  ON nutrition_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs"
  ON nutrition_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs"
  ON nutrition_logs FOR DELETE
  USING (auth.uid() = user_id); 