export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  time?: string;
  note?: string;
  type: "primary" | "optional" | "cardio" | "circuit" | "daily";
  category?: string;
}

export interface Workout {
  name: string;
  exercises: Exercise[];
}

export interface Workouts {
  [key: string]: Workout;
}

export const workouts: Workouts = {
  Monday: {
    name: "Chest & Triceps",
    exercises: [
      {
        name: "Bench Press (or chest press machine)",
        sets: 3,
        reps: "8-10",
        type: "primary",
      },
      {
        name: "Dumbbell Flyes",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Tricep Dips (or tricep press)",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Tricep Extensions",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Plank",
        sets: 3,
        time: "30-45 seconds",
        type: "optional",
        category: "Abs",
      },
    ],
  },
  Tuesday: {
    name: "Back & Biceps",
    exercises: [
      {
        name: "Lat Pulldowns",
        sets: 3,
        reps: "8-10",
        type: "primary",
      },
      {
        name: "Seated Row (machine)",
        sets: 3,
        reps: "8-10",
        type: "primary",
      },
      {
        name: "Dumbbell Bicep Curls",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Hammer Curls",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Bicycle Crunches",
        sets: 3,
        reps: "15-20",
        type: "optional",
        category: "Abs",
      },
    ],
  },
  Wednesday: {
    name: "Legs & Glutes",
    exercises: [
      {
        name: "Squats (machine or free weights)",
        sets: 3,
        reps: "8-10",
        type: "primary",
      },
      {
        name: "Leg Press",
        sets: 3,
        reps: "8-10",
        type: "primary",
      },
      {
        name: "Lunges",
        sets: 3,
        reps: "8-10 (each leg)",
        type: "primary",
      },
      {
        name: "Glute Bridges",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Calf Raises",
        sets: 3,
        reps: "12-15",
        type: "primary",
      },
    ],
  },
  Thursday: {
    name: "Shoulders & Abs",
    exercises: [
      {
        name: "Shoulder Press (machine or dumbbells)",
        sets: 3,
        reps: "8-10",
        type: "primary",
      },
      {
        name: "Lateral Raises",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Front Raises",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Shrugs",
        sets: 3,
        reps: "10-12",
        type: "primary",
      },
      {
        name: "Leg Raises / Crunches",
        sets: 3,
        reps: "15",
        type: "primary",
        category: "Abs",
      },
    ],
  },
  Friday: {
    name: "Full-Body or Cardio",
    exercises: [
      {
        name: "Treadmill / Elliptical / Stair Climber",
        time: "15-20 minutes",
        type: "cardio",
      },
      {
        name: "Light circuit (push-ups, planks, squats, lunges, dips)",
        sets: 1,
        note: "Focus on technique/form over heavy weights to prevent injury",
        type: "circuit",
      },
    ],
  },
  Daily: {
    name: "Before-Bed Routine",
    exercises: [
      {
        name: "Light Push-Ups",
        sets: 2,
        reps: "10-15",
        type: "daily",
      },
      {
        name: "Stretching/Yoga",
        time: "5 minutes",
        note: "Focus on tight areas like shoulders, back, hips",
        type: "daily",
      },
      {
        name: "Deep Breathing",
        time: "1-2 minutes",
        note: "Calm breathing to relax",
        type: "daily",
      },
    ],
  },
};

export const getWorkoutForDay = (day: string): Workout | null => {
  return workouts[day] || null;
};

export const getAllWorkoutDays = (): string[] => {
  return Object.keys(workouts);
};
