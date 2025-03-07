import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Workout related functions
export async function getWorkoutLog(userId: string, date: string) {
  const { data, error } = await supabase
    .from("workout_logs")
    .select(
      `
      *,
      exercise_logs(*)
    `
    )
    .eq("user_id", userId)
    .eq("date", date)
    .single();

  if (error) {
    console.error("Error fetching workout log:", error);
    return null;
  }

  return data;
}

export async function saveWorkoutLog(
  userId: string,
  date: string,
  workoutDayId: string,
  exerciseData: {
    exerciseId: string;
    completed: boolean;
    weights: string[];
    sets_completed?: number;
    reps_completed?: string[];
  }[]
) {
  // First, create or update the workout log
  const { data: workoutLog, error: workoutError } = await supabase
    .from("workout_logs")
    .upsert({
      user_id: userId,
      date: date,
      workout_day_id: workoutDayId,
      completed_at: exerciseData.every((ex) => ex.completed)
        ? new Date().toISOString()
        : null,
    })
    .select()
    .single();

  if (workoutError) {
    console.error("Error saving workout log:", workoutError);
    return null;
  }

  // Then, save each exercise log
  const exerciseLogs = exerciseData.map((exercise) => ({
    workout_log_id: workoutLog.id,
    exercise_id: exercise.exerciseId,
    sets_completed: exercise.sets_completed || 0,
    reps_completed: exercise.reps_completed || [],
    weight_used: exercise.weights.map((w) => parseFloat(w) || 0),
    completed: exercise.completed,
  }));

  const { error: exerciseError } = await supabase
    .from("exercise_logs")
    .upsert(exerciseLogs);

  if (exerciseError) {
    console.error("Error saving exercise logs:", exerciseError);
    return null;
  }

  return workoutLog;
}

export async function getWeeklyProgress(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from("workout_logs")
    .select(
      `
      date,
      completed_at,
      exercise_logs(completed)
    `
    )
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Error fetching weekly progress:", error);
    return null;
  }

  return data;
}

// User profile related functions
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

export async function updateUserProfile(userId: string, profile: any) {
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      id: userId,
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    return null;
  }

  return data;
}

// Progress tracking functions
export async function saveProgressEntry(userId: string, progressData: any) {
  const { data, error } = await supabase
    .from("progress_tracking")
    .upsert({
      user_id: userId,
      ...progressData,
      date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving progress:", error);
    return null;
  }

  return data;
}
