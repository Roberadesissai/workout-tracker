import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

interface WorkoutData {
  duration: number;
  exercisesCompleted: number;
  totalExercises: number;
  completionTime: Date;
  isShared?: boolean;
}

interface ProgressData {
  type: "weight" | "measurements" | "daily";
  achieved?: boolean;
}

interface SocialData {
  type: "like" | "inspire";
  count: number;
}

let consecutiveDaysCache: { [userId: string]: number } = {};
let weekendWorkoutsCache: { [userId: string]: number } = {};

export async function updateAchievements(
  workoutData: WorkoutData | ProgressData | SocialData
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's achievements
    const { data: userAchievements, error: userError } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id);

    if (userError) throw userError;

    // Get all achievement types
    const { data: achievementTypes, error: typeError } = await supabase
      .from("achievement_types")
      .select("*");

    if (typeError) throw typeError;
    if (!achievementTypes) return;

    // Process each achievement type
    for (const achievement of achievementTypes) {
      let currentProgress = 0;
      let shouldUpdate = false;

      // Get existing progress
      const existingProgress =
        userAchievements?.find((ua) => ua.achievement_id === achievement.id)
          ?.progress.current || 0;

      if ("duration" in workoutData) {
        // Workout-related achievements
        switch (achievement.name) {
          case "First Workout":
            currentProgress = 1;
            shouldUpdate = true;
            break;

          case "Workout Warrior":
            currentProgress = existingProgress + 1;
            shouldUpdate = true;
            break;

          case "Exercise Master":
            currentProgress = existingProgress + workoutData.exercisesCompleted;
            shouldUpdate = true;
            break;

          case "Perfect Form":
            if (workoutData.exercisesCompleted === workoutData.totalExercises) {
              currentProgress = 1;
              shouldUpdate = true;
            }
            break;

          case "Consistency King":
            // Update consecutive days cache
            const today = new Date().toDateString();
            const userId = user.id;
            if (!consecutiveDaysCache[userId]) {
              consecutiveDaysCache[userId] = 1;
            } else {
              const lastWorkout = new Date(workoutData.completionTime);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              if (lastWorkout.toDateString() === yesterday.toDateString()) {
                consecutiveDaysCache[userId]++;
              } else {
                consecutiveDaysCache[userId] = 1;
              }
            }
            currentProgress = Math.max(
              consecutiveDaysCache[userId],
              existingProgress
            );
            shouldUpdate = true;
            break;

          case "Time Champion":
            currentProgress = existingProgress + workoutData.duration;
            shouldUpdate = true;
            break;

          case "Early Bird":
            if (workoutData.completionTime.getHours() < 8) {
              currentProgress = existingProgress + 1;
              shouldUpdate = true;
            }
            break;

          case "Night Owl":
            if (workoutData.completionTime.getHours() >= 20) {
              currentProgress = existingProgress + 1;
              shouldUpdate = true;
            }
            break;

          case "Weekend Warrior":
            const isWeekend =
              workoutData.completionTime.getDay() === 0 ||
              workoutData.completionTime.getDay() === 6;
            if (isWeekend) {
              currentProgress = existingProgress + 1;
              shouldUpdate = true;
            }
            break;

          case "Social Butterfly":
            if (workoutData.isShared) {
              currentProgress = existingProgress + 1;
              shouldUpdate = true;
            }
            break;
        }
      } else if ("type" in workoutData && workoutData.type === "like") {
        // Social achievements
        switch (achievement.name) {
          case "Community Leader":
            currentProgress = existingProgress + workoutData.count;
            shouldUpdate = true;
            break;
        }
      } else if ("type" in workoutData && workoutData.type === "inspire") {
        switch (achievement.name) {
          case "Motivator":
            currentProgress = existingProgress + workoutData.count;
            shouldUpdate = true;
            break;
        }
      } else if (
        "type" in workoutData &&
        (workoutData.type === "weight" ||
          workoutData.type === "measurements" ||
          workoutData.type === "daily")
      ) {
        // Progress tracking achievements
        switch (achievement.name) {
          case "Progress Tracker":
            if (workoutData.type === "daily") {
              currentProgress = existingProgress + 1;
              shouldUpdate = true;
            }
            break;

          case "Weight Goal Achiever":
            if (workoutData.type === "weight" && workoutData.achieved) {
              currentProgress = 1;
              shouldUpdate = true;
            }
            break;

          case "Measurement Master":
            if (workoutData.type === "measurements") {
              currentProgress = existingProgress + 1;
              shouldUpdate = true;
            }
            break;
        }
      }

      if (shouldUpdate) {
        const existingAchievement = userAchievements?.find(
          (ua) => ua.achievement_id === achievement.id
        );
        const completed = currentProgress >= achievement.requirements.target;

        if (existingAchievement) {
          // Update existing achievement
          const { error: updateError } = await supabase
            .from("user_achievements")
            .update({
              progress: {
                current: currentProgress,
                target: achievement.requirements.target,
              },
              completed,
              earned_at:
                completed && !existingAchievement.completed
                  ? new Date().toISOString()
                  : existingAchievement.earned_at,
            })
            .eq("id", existingAchievement.id);

          if (updateError) throw updateError;
        } else {
          // Create new achievement progress
          const { error: insertError } = await supabase
            .from("user_achievements")
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
              progress: {
                current: currentProgress,
                target: achievement.requirements.target,
              },
              completed,
              earned_at: completed ? new Date().toISOString() : null,
            });

          if (insertError) throw insertError;
        }

        // If newly completed, show a toast notification
        if (
          completed &&
          (!existingAchievement || !existingAchievement.completed)
        ) {
          toast.success(`Achievement Unlocked: ${achievement.name}!`, {
            description: achievement.description,
            duration: 5000,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error updating achievements:", error);
    toast.error("Failed to update achievements");
  }
}

// Helper function to update social achievements
export async function updateSocialAchievements(data: SocialData) {
  await updateAchievements(data);
}

// Helper function to update progress achievements
export async function updateProgressAchievements(data: ProgressData) {
  await updateAchievements(data);
}

// Helper function to update workout achievements
export async function updateWorkoutAchievements(data: WorkoutData) {
  await updateAchievements(data);
}
