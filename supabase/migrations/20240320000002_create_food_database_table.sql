-- Drop existing tables if they exist
DROP TABLE IF EXISTS nutrition_logs;
DROP TABLE IF EXISTS food_database;

-- Create food_database table
CREATE TABLE food_database (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  serving_size VARCHAR(100) NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1) NOT NULL,
  carbs DECIMAL(5,1) NOT NULL,
  fats DECIMAL(5,1) NOT NULL,
  fiber DECIMAL(5,1),
  sugar DECIMAL(5,1),
  sodium INTEGER,
  cholesterol INTEGER,
  saturated_fats DECIMAL(5,1),
  trans_fats DECIMAL(5,1),
  vitamins JSONB DEFAULT '{}',
  minerals JSONB DEFAULT '{}',
  category VARCHAR(50) NOT NULL,
  brand VARCHAR(100),
  user_id UUID REFERENCES auth.users(id),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT valid_category CHECK (category IN (
    'Meat', 'Fish', 'Poultry', 'Dairy', 'Eggs',
    'Grains', 'Vegetables', 'Fruits', 'Nuts',
    'Legumes', 'Oils', 'Beverages', 'Snacks',
    'Desserts', 'Condiments', 'Vegetarian'
  ))
);

-- Create nutrition_logs table
CREATE TABLE nutrition_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES food_database(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL,
  servings DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT valid_meal_type CHECK (meal_type IN (
    'breakfast', 'lunch', 'dinner', 'snack'
  )),
  CONSTRAINT valid_servings CHECK (servings > 0)
);

-- Create indexes for food_database
CREATE INDEX idx_food_database_name ON food_database (name);
CREATE INDEX idx_food_database_category ON food_database (category);
CREATE INDEX idx_food_database_user_id ON food_database (user_id);
CREATE INDEX idx_food_database_verified ON food_database (is_verified);
CREATE INDEX idx_food_database_vitamins ON food_database USING gin (vitamins);
CREATE INDEX idx_food_database_minerals ON food_database USING gin (minerals);

-- Create indexes for nutrition_logs
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs (user_id, date);
CREATE INDEX idx_nutrition_logs_food_id ON nutrition_logs (food_id);
CREATE INDEX idx_nutrition_logs_meal_type ON nutrition_logs (meal_type);

-- Enable Row Level Security
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for food_database
CREATE POLICY "Users can view all verified foods"
  ON food_database
  FOR SELECT
  USING (is_verified = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own foods"
  ON food_database
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own foods"
  ON food_database
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own foods"
  ON food_database
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for nutrition_logs
CREATE POLICY "Users can view their own nutrition logs"
  ON nutrition_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs"
  ON nutrition_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs"
  ON nutrition_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs"
  ON nutrition_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_food_database_updated_at
  BEFORE UPDATE ON food_database
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_logs_updated_at
  BEFORE UPDATE ON nutrition_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert common verified foods with enhanced nutritional information
INSERT INTO food_database (
  name, serving_size, calories, protein, carbs, fats,
  fiber, sugar, sodium, cholesterol, saturated_fats,
  category, is_verified, vitamins, minerals
) VALUES
  ('Chicken Breast', '100g', 165, 31.0, 0.0, 3.6, 0.0, 0.0, 74, 85, 1.0, 'Meat', true,
   '{"B6": 0.6, "B12": 0.3, "Niacin": 13.7}',
   '{"potassium": 256, "phosphorus": 210, "selenium": 27.6}'),
  ('Brown Rice', '100g cooked', 112, 2.6, 23.5, 0.8, 1.8, 0.0, 1, 0, 0.2, 'Grains', true,
   '{"B1": 0.1, "B6": 0.1, "Folate": 8}',
   '{"magnesium": 44, "iron": 0.5, "zinc": 0.6}'),
  ('Broccoli', '100g', 34, 2.8, 6.6, 0.4, 2.6, 1.7, 33, 0, 0.0, 'Vegetables', true,
   '{"C": 89.2, "K": 101.6, "A": 623}',
   '{"calcium": 47, "iron": 0.7, "potassium": 316}'),
  ('Salmon', '100g', 208, 22.0, 0.0, 13.0, 0.0, 0.0, 59, 55, 3.1, 'Fish', true,
   '{"D": 13.1, "B12": 2.6, "B6": 0.6}',
   '{"selenium": 36.5, "phosphorus": 240, "potassium": 363}'),
  ('Sweet Potato', '100g', 86, 1.6, 20.1, 0.1, 3.0, 4.2, 55, 0, 0.0, 'Vegetables', true,
   '{"A": 14187, "C": 2.4, "B6": 0.2}',
   '{"potassium": 337, "manganese": 0.3, "magnesium": 25}'),
  ('Greek Yogurt', '100g', 59, 10.0, 3.6, 0.4, 0.0, 3.6, 34, 5, 0.2, 'Dairy', true,
   '{"B12": 0.5, "B2": 0.2, "B5": 0.4}',
   '{"calcium": 111, "phosphorus": 135, "potassium": 141}'),
  ('Almonds', '28g', 164, 6.0, 6.1, 14.0, 3.5, 1.2, 0, 0, 1.1, 'Nuts', true,
   '{"E": 7.3, "B2": 0.3, "B7": 1.5}',
   '{"magnesium": 76, "phosphorus": 136, "manganese": 0.6}'),
  ('Banana', '100g', 89, 1.1, 22.8, 0.3, 2.6, 12.2, 1, 0, 0.1, 'Fruits', true,
   '{"B6": 0.4, "C": 8.7, "B9": 20}',
   '{"potassium": 358, "magnesium": 27, "manganese": 0.3}'),
  ('Eggs', '1 large', 72, 6.3, 0.4, 4.8, 0.0, 0.2, 71, 186, 1.6, 'Eggs', true,
   '{"A": 270, "D": 1.1, "B12": 0.6}',
   '{"selenium": 15.4, "phosphorus": 86, "zinc": 0.6}'),
  ('Quinoa', '100g cooked', 120, 4.4, 21.3, 1.9, 2.8, 0.9, 7, 0, 0.2, 'Grains', true,
   '{"B1": 0.2, "B6": 0.2, "Folate": 42}',
   '{"magnesium": 64, "phosphorus": 152, "iron": 1.5}'); 