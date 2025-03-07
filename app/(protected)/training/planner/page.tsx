"use client";

import {
  Home,
  Dumbbell,
  Calendar,
  Heart,
  StretchVertical as Stretch,
  Timer,
  Users,
  Brain,
  Target,
  Activity,
  Weight,
  Plus,
  PlayCircle,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

interface DatabaseExercise {
  id: string;
  name: string;
  description: string;
  category: string;
  equipment: string[];
  muscle_groups: string[];
}

interface WorkoutExercise {
  id: string;
  workout_program_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_time: number;
  notes: string;
  order_index: number;
  exercise: DatabaseExercise;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest_time: number;
  notes: string;
  category: string;
}

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
}

interface ExerciseCategory {
  name: string;
  description: string;
  icon: React.ReactNode;
  backgroundImage: string;
  muscleGroups?: string[];
  defaultSets?: number;
  defaultReps?: string;
  defaultRestTime?: number;
}

interface WorkoutHistory {
  id: string;
  program_id: string;
  program_name: string;
  completed_at: string;
  duration: number;
  exercises_completed: number;
  total_exercises: number;
  notes: string;
}

interface WorkoutHistoryResponse {
  id: string;
  program_id: string;
  program: {
    name: string;
  };
  completed_at: string;
  duration: number;
  exercises_completed: number;
  total_exercises: number;
  notes: string;
}

interface ExerciseOption {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment: string[];
}

const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
    name: "strength",
    description: "Build muscle and increase strength with weight training",
    icon: <Dumbbell className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/Close_Up_Power_Grip.jpg",
    muscleGroups: ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"],
    defaultSets: 4,
    defaultReps: "8-12",
    defaultRestTime: 90,
  },
  {
    name: "cardio",
    description: "Improve endurance and heart health",
    icon: <Heart className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/cardio.jpg",
    defaultSets: 1,
    defaultReps: "20-30 mins",
    defaultRestTime: 60,
  },
  {
    name: "flexibility",
    description: "Enhance mobility and reduce injury risk",
    icon: <Stretch className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/Training.jpg",
    muscleGroups: ["Full Body", "Upper Body", "Lower Body", "Core"],
    defaultSets: 3,
    defaultReps: "30-45 secs",
    defaultRestTime: 30,
  },
  {
    name: "hiit",
    description: "High-intensity interval training for maximum results",
    icon: <Timer className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/Mid-Workout_Intensity.jpg",
    defaultSets: 5,
    defaultReps: "45 secs work / 15 secs rest",
    defaultRestTime: 60,
  },
  {
    name: "sports",
    description: "Sport-specific training and drills",
    icon: <Users className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/Team_Huddle.jpg",
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestTime: 60,
  },
  {
    name: "mind-body",
    description: "Focus on mental and physical connection",
    icon: <Brain className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/Progress.jpg",
    defaultSets: 1,
    defaultReps: "20-30 mins",
    defaultRestTime: 0,
  },
  {
    name: "crossfit",
    description: "High-intensity functional movements for overall fitness",
    icon: <Activity className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/Workout_Planner.jpg",
    muscleGroups: ["Full Body", "Core", "Conditioning"],
    defaultSets: 5,
    defaultReps: "AMRAP",
    defaultRestTime: 45,
  },
  {
    name: "powerlifting",
    description: "Focus on the big three: squat, bench press, and deadlift",
    icon: <Weight className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/Powerlifting.jpg",
    muscleGroups: ["Legs", "Chest", "Back", "Core"],
    defaultSets: 5,
    defaultReps: "1-5",
    defaultRestTime: 180,
  },
  {
    name: "custom",
    description: "Create your own custom workout program",
    icon: <Target className="h-8 w-8 text-white" />,
    backgroundImage: "/images/hero/Workouts.jpg",
  },
];

const PROGRAM_TEMPLATES = {
  strength: [
    {
      name: "Full Body Strength",
      description:
        "A comprehensive full-body workout focusing on compound movements to build overall strength and muscle mass.",
    },
    {
      name: "Upper Body Power",
      description:
        "Build chest, back, and shoulder strength with this upper body focused program.",
    },
    {
      name: "Lower Body Strength",
      description:
        "Develop strong legs and core with squats, deadlifts, and leg presses.",
    },
    {
      name: "Strength & Power",
      description:
        "Combine strength training with power movements for maximum muscle growth.",
    },
  ],
  cardio: [
    {
      name: "Endurance Builder",
      description:
        "Improve cardiovascular fitness with this endurance-focused program.",
    },
    {
      name: "Cardio Blast",
      description:
        "High-energy cardio workout to burn calories and boost metabolism.",
    },
    {
      name: "Interval Training",
      description:
        "Mix of high and low intensity intervals for maximum calorie burn.",
    },
  ],
  flexibility: [
    {
      name: "Mobility Flow",
      description:
        "Improve flexibility and reduce injury risk with this mobility program.",
    },
    {
      name: "Stretching Routine",
      description:
        "Comprehensive stretching program for better range of motion.",
    },
    {
      name: "Flexibility & Balance",
      description:
        "Combine stretching with balance exercises for better body control.",
    },
  ],
  hiit: [
    {
      name: "HIIT Circuit",
      description:
        "High-intensity interval training circuit for maximum calorie burn.",
    },
    {
      name: "Tabata Training",
      description:
        "20 seconds on, 10 seconds off intervals for intense fat burning.",
    },
    {
      name: "HIIT Power",
      description:
        "Combine HIIT with strength movements for total body conditioning.",
    },
  ],
  sports: [
    {
      name: "Sports Performance",
      description: "Sport-specific training to enhance athletic performance.",
    },
    {
      name: "Agility Training",
      description:
        "Improve speed, agility, and reaction time with this program.",
    },
    {
      name: "Power & Speed",
      description:
        "Combine power movements with speed work for athletic development.",
    },
  ],
  "mind-body": [
    {
      name: "Mindful Movement",
      description: "Combine physical movement with mental focus and breathing.",
    },
    {
      name: "Yoga Flow",
      description: "Flowing yoga sequences for strength and flexibility.",
    },
    {
      name: "Pilates Power",
      description: "Core-focused Pilates program for strength and stability.",
    },
  ],
  crossfit: [
    {
      name: "CrossFit Style",
      description:
        "High-intensity functional movements combining strength and conditioning.",
    },
    {
      name: "WOD Circuit",
      description: "Workout of the day style circuit training.",
    },
    {
      name: "Functional Power",
      description: "Combine functional movements with power training.",
    },
  ],
  powerlifting: [
    {
      name: "Powerlifting Focus",
      description:
        "Focus on the big three lifts: squat, bench press, and deadlift.",
    },
    {
      name: "Strength & Power",
      description: "Build raw strength with compound movements.",
    },
    {
      name: "Powerlifting Prep",
      description: "Prepare for powerlifting with specialized training.",
    },
  ],
};

const EXERCISE_TEMPLATES = {
  strength: [
    "Bench Press",
    "Squat",
    "Deadlift",
    "Pull-ups",
    "Push-ups",
    "Shoulder Press",
    "Bicep Curls",
    "Tricep Extensions",
    "Leg Press",
    "Romanian Deadlift",
  ],
  cardio: [
    "Running",
    "Cycling",
    "Swimming",
    "Jump Rope",
    "Burpees",
    "Mountain Climbers",
    "High Knees",
    "Jumping Jacks",
    "Rowing",
    "Stair Climbing",
  ],
  flexibility: [
    "Forward Fold",
    "Downward Dog",
    "Warrior Pose",
    "Child's Pose",
    "Cat-Cow Stretch",
    "Hip Flexor Stretch",
    "Shoulder Stretch",
    "Hamstring Stretch",
    "Quad Stretch",
    "Spinal Twist",
  ],
  hiit: [
    "Burpees",
    "Mountain Climbers",
    "Jump Squats",
    "Push-up to Plank",
    "High Knees",
    "Jumping Jacks",
    "Plank to Downward Dog",
    "Russian Twists",
    "Box Jumps",
    "Battle Ropes",
  ],
  sports: [
    "Agility Ladder",
    "Sprint Intervals",
    "Lateral Shuffles",
    "Box Jumps",
    "Medicine Ball Throws",
    "Plyometric Jumps",
    "Speed Skaters",
    "Cone Drills",
    "Reaction Ball",
    "Shuttle Runs",
  ],
  "mind-body": [
    "Sun Salutation",
    "Warrior Flow",
    "Balance Poses",
    "Breathing Exercises",
    "Meditation",
    "Tai Chi Moves",
    "Yoga Flow",
    "Pilates Mat",
    "Stretching Flow",
    "Mindful Movement",
  ],
  crossfit: [
    "Thrusters",
    "Wall Balls",
    "Kettlebell Swings",
    "Box Jumps",
    "Pull-ups",
    "Push-ups",
    "Burpees",
    "Double Unders",
    "Clean and Jerk",
    "Snatch",
  ],
  powerlifting: [
    "Squat",
    "Bench Press",
    "Deadlift",
    "Overhead Press",
    "Front Squat",
    "Romanian Deadlift",
    "Good Mornings",
    "Pause Squats",
    "Deficit Deadlifts",
    "Incline Bench Press",
  ],
};

const workoutProgramSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  schedule: z.object({
    days: z.array(z.number()),
    startTime: z.string(),
    duration: z.number().min(15, "Workout must be at least 15 minutes"),
    repeat: z.enum(["none", "daily", "weekly", "monthly"]),
  }),
  exercises: z.array(
    z.object({
      name: z.string().min(1, "Exercise name is required"),
      sets: z.number().min(1, "At least one set is required"),
      reps: z.string().min(1, "Reps are required"),
      rest_time: z.number(),
      notes: z.string().optional(),
      muscle_group: z.string().optional(),
      equipment: z.array(z.string()).optional(),
    })
  ),
});

// Add this mapping for exercise to muscle group
const EXERCISE_MUSCLE_GROUPS = {
  // Strength exercises
  "Bench Press": "chest",
  "Incline Bench Press": "chest",
  "Decline Bench Press": "chest",
  "Pull-ups": "back",
  Deadlift: "back",
  "Romanian Deadlift": "back",
  "Shoulder Press": "shoulders",
  "Bicep Curls": "biceps",
  "Tricep Extensions": "triceps",
  Squat: "legs",
  "Leg Press": "legs",
  "Front Squat": "legs",
  "Pause Squats": "legs",
  "Deficit Deadlifts": "legs",
  "Good Mornings": "legs",
  "Overhead Press": "shoulders",
  "Incline Bench Press": "chest",
  "Clean and Jerk": "full_body",
  Snatch: "full_body",
  Thrusters: "full_body",
  "Wall Balls": "full_body",
  "Kettlebell Swings": "full_body",
  "Box Jumps": "legs",
  "Push-ups": "chest",
  Burpees: "full_body",
  "Mountain Climbers": "core",
  "Russian Twists": "core",
  "Plank to Downward Dog": "core",
  "Battle Ropes": "full_body",
  "Double Unders": "full_body",
  "WOD Circuit": "full_body",
  "Functional Power": "full_body",
  "Powerlifting Focus": "full_body",
  "Strength & Power": "full_body",
  "Powerlifting Prep": "full_body",
  "Full Body Strength": "full_body",
  "Upper Body Power": "upper_body",
  "Lower Body Strength": "legs",
  "Core Workout": "core",
  "Endurance Builder": "full_body",
  "Cardio Blast": "full_body",
  "Interval Training": "full_body",
  "Mobility Flow": "full_body",
  "Stretching Routine": "full_body",
  "Flexibility & Balance": "full_body",
  "HIIT Circuit": "full_body",
  "Tabata Training": "full_body",
  "HIIT Power": "full_body",
  "Sports Performance": "full_body",
  "Agility Training": "full_body",
  "Power & Speed": "full_body",
  "Mindful Movement": "full_body",
  "Yoga Flow": "full_body",
  "Pilates Power": "core",
  "CrossFit Style": "full_body",
};

export default function PlannerPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutHistory[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [programOptions, setProgramOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [isCustomProgram, setIsCustomProgram] = useState(false);
  const [isCustomExercise, setIsCustomExercise] = useState<{
    [key: number]: boolean;
  }>({});

  const form = useForm<z.infer<typeof workoutProgramSchema>>({
    resolver: zodResolver(workoutProgramSchema),
    defaultValues: {
      name: "",
      description: "",
      schedule: {
        days: [],
        startTime: "09:00",
        duration: 60,
        repeat: "none",
      },
      exercises: [
        {
          name: "",
          sets: 3,
          reps: "8-12",
          rest_time: 60,
          notes: "",
          muscle_group: "",
          equipment: [],
        },
      ],
    },
  });

  useEffect(() => {
    fetchPrograms();
    fetchExercises();
    fetchRecentWorkouts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchExerciseOptions();
    }
  }, [selectedCategory]);

  const fetchExercises = async () => {
    try {
      const { data: exerciseData, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      if (exerciseData) {
        setAvailableExercises(exerciseData);
      }
    } catch (err) {
      console.error("Error fetching exercises:", err);
      toast.error("Failed to fetch exercises");
    }
  };

  const fetchPrograms = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No user found");
        return;
      }

      console.log("Fetching programs for user:", user.id);

      // Fetch programs with a distinct constraint
      const { data: programsData, error: programsError } = await supabase
        .from("workout_programs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (programsError) {
        console.error("Error fetching programs:", programsError);
        toast.error("Failed to fetch programs");
        return;
      }

      console.log("Fetched programs:", programsData);

      if (!programsData || programsData.length === 0) {
        console.log("No programs found");
        setPrograms([]);
        return;
      }

      // Remove any duplicate programs based on name and description
      const uniquePrograms = programsData.filter(
        (program, index, self) =>
          index ===
          self.findIndex(
            (p) =>
              p.name === program.name && p.description === program.description
          )
      );

      // Then fetch exercises for each unique program
      const programsWithExercises = await Promise.all(
        uniquePrograms.map(async (program) => {
          console.log("Fetching exercises for program:", program.id);

          const { data: exercisesData, error: exercisesError } = await supabase
            .from("workout_exercises")
            .select(
              `
              *,
              exercise:exercises(*)
            `
            )
            .eq("workout_program_id", program.id)
            .order("order_index");

          if (exercisesError) {
            console.error(
              `Error fetching exercises for program ${program.id}:`,
              exercisesError
            );
            return {
              ...program,
              exercises: [],
            };
          }

          console.log(`Exercises for program ${program.id}:`, exercisesData);

          return {
            ...program,
            exercises: exercisesData.map((ex) => ({
              id: ex.id,
              name: ex.exercise?.name || "Unknown Exercise",
              sets: ex.sets || 3,
              reps: ex.reps || "8-12",
              rest_time: ex.rest_time || 60,
              notes: ex.notes || "",
              category: ex.exercise?.category || "other",
            })),
          };
        })
      );

      console.log("Final programs with exercises:", programsWithExercises);
      setPrograms(programsWithExercises);
    } catch (err) {
      console.error("Error in fetchPrograms:", err);
      toast.error("Failed to fetch programs");
    }
  };

  const fetchRecentWorkouts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("workout_history")
          .select(
            `
            id,
            program_id,
            program:workout_programs(name),
            completed_at,
            duration,
            exercises_completed,
            total_exercises,
            notes
          `
          )
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        if (data) {
          const typedData = data as unknown as WorkoutHistoryResponse[];
          setRecentWorkouts(
            typedData.map((workout) => ({
              id: workout.id,
              program_id: workout.program_id,
              program_name: workout.program.name,
              completed_at: workout.completed_at,
              duration: workout.duration,
              exercises_completed: workout.exercises_completed,
              total_exercises: workout.total_exercises,
              notes: workout.notes,
            }))
          );
        }
      }
    } catch (err) {
      console.error("Error fetching recent workouts:", err);
      toast.error("Failed to fetch recent workouts");
    }
  };

  const fetchExerciseOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("category", selectedCategory)
        .order("name");

      if (error) throw error;
      if (data) {
        setExerciseOptions(data);
      }
    } catch (err) {
      console.error("Error fetching exercise options:", err);
      toast.error("Failed to fetch exercise options");
    }
  };

  const onSubmit = async (values: z.infer<typeof workoutProgramSchema>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to create a workout program");
        return;
      }

      // Create the workout program
      const { data: program, error: programError } = await supabase
        .from("workout_programs")
        .insert({
          user_id: user.id,
          name: values.name,
          description: values.description,
          recurrence: {
            repeat: values.schedule.repeat,
            days: values.schedule.days,
            startTime: values.schedule.startTime,
            duration: values.schedule.duration,
          },
        })
        .select()
        .single();

      if (programError) {
        toast.error("Failed to create workout program");
        return;
      }

      // Create exercises
      const exercisePromises = values.exercises.map(async (exercise, index) => {
        // First, check if this is a predefined exercise or custom one
        let exerciseId: string | null = null;
        const matchingExercise = availableExercises.find(
          (e) => e.name === exercise.name
        );

        if (!matchingExercise) {
          // Create a new exercise in the exercises table
          const { data: newExercise, error: newExerciseError } = await supabase
            .from("exercises")
            .insert({
              name: exercise.name,
              category: selectedCategory,
              muscle_groups: exercise.muscle_group
                ? [exercise.muscle_group]
                : [],
              equipment: exercise.equipment || [],
            })
            .select()
            .single();

          if (newExerciseError) throw newExerciseError;
          exerciseId = newExercise.id;
        } else {
          exerciseId = matchingExercise.id;
        }

        // Create the workout exercise
        const { error: exerciseError } = await supabase
          .from("workout_exercises")
          .insert({
            workout_program_id: program.id,
            exercise_id: exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_time: exercise.rest_time,
            notes: exercise.notes,
            order_index: index,
          });

        if (exerciseError) throw exerciseError;
      });

      try {
        await Promise.all(exercisePromises);

        // Only attempt to create scheduled events if the workout is recurring
        if (values.schedule.repeat !== "none") {
          try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1); // Schedule for the next month

            // Parse the time string and combine it with the current date
            const [hours, minutes] = values.schedule.startTime.split(":");
            const eventStartTime = new Date(startDate);
            eventStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const { error: scheduleError } = await supabase
              .from("scheduled_events")
              .insert({
                user_id: user.id,
                title: values.name,
                description: values.description,
                start_time: eventStartTime.toISOString(),
                event_type: "workout",
                recurrence: {
                  type: values.schedule.repeat,
                  days: values.schedule.days,
                  start_date: startDate.toISOString(),
                  end_date: endDate.toISOString(),
                },
              });

            if (scheduleError) {
              console.error(
                "Failed to create scheduled events:",
                scheduleError
              );
              // Don't show error to user since this is optional functionality
              // Just log it for debugging
            }
          } catch (scheduleError) {
            console.error("Error creating scheduled events:", scheduleError);
            // Don't show error to user since this is optional functionality
            // Just log it for debugging
          }
        }

        toast.success("Workout program created successfully");
        form.reset();
        fetchPrograms();
      } catch (err) {
        console.error("Error creating exercises:", err);
        toast.error("Failed to create exercises");
      }
    } catch (err) {
      console.error("Error in form submission:", err);
      toast.error("Failed to create workout program");
    }
  };

  const startWorkout = (programId: string) => {
    router.push(`/training/workout?program=${programId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Breadcrumb Navigation */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/training">Training</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Planner</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 mx-4 sm:mx-8 mt-6">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 p-4 sm:p-8">
          <div className="flex-1 min-w-[50%] text-center md:text-left">
            <div className="flex items-center gap-4 mb-4 justify-center md:justify-start">
              <div className="rounded-full bg-primary/10 p-3">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Workout Planner
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create personalized workout programs and track your fitness
              journey
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Workout_Planner.jpg"
              alt="Workout Planner"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {!selectedCategory ? (
          // Category Selection Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {EXERCISE_CATEGORIES.map((category) => (
              <div
                key={category.name}
                className="group relative h-[280px] sm:h-[320px] rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => setSelectedCategory(category.name)}
              >
                <div className="absolute inset-0">
                  <Image
                    src={category.backgroundImage}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/50" />
                </div>

                <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="rounded-xl bg-white/10 backdrop-blur-md p-3 sm:p-4 shadow-lg ring-1 ring-white/20 group-hover:bg-primary/90 group-hover:ring-primary group-hover:scale-110 transition-all duration-500">
                        {category.icon}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white capitalize">
                        {category.name}
                      </h3>
                    </div>
                    <p className="text-white/90 text-base sm:text-lg">
                      {category.description}
                    </p>
                    {category.muscleGroups && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-white/90 uppercase tracking-wider">
                          TARGET AREAS
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {category.muscleGroups.map((group) => (
                            <span
                              key={group}
                              className="text-xs bg-white/10 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-full ring-1 ring-white/20 group-hover:bg-primary/20 group-hover:ring-primary/30 transition-all duration-300"
                            >
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                      {category.defaultRestTime}s rest
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                      {category.defaultSets || "-"} sets
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />
                      {category.defaultReps || "Custom"} reps
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Program Creation Form
          <div className="grid gap-4 sm:gap-8 lg:grid-cols-12">
            {/* Left Column - Form */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-8">
              {/* Category Preview */}
              <div className="relative h-[160px] sm:h-[200px] rounded-2xl overflow-hidden group">
                <div className="absolute inset-0">
                  <Image
                    src={
                      EXERCISE_CATEGORIES.find(
                        (c) => c.name === selectedCategory
                      )?.backgroundImage || ""
                    }
                    alt={selectedCategory}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-black/30" />
                </div>
                <div className="relative h-full flex flex-col sm:flex-row items-center justify-between p-4 sm:p-8 gap-4">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3 sm:p-4 shadow-lg ring-1 ring-white/20 group-hover:bg-primary/90 group-hover:ring-primary group-hover:scale-110 transition-all duration-500">
                      {
                        EXERCISE_CATEGORIES.find(
                          (c) => c.name === selectedCategory
                        )?.icon
                      }
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white capitalize mb-2">
                        {selectedCategory} Workouts
                      </h2>
                      <p className="text-white/90 text-base sm:text-lg">
                        {
                          EXERCISE_CATEGORIES.find(
                            (c) => c.name === selectedCategory
                          )?.description
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setSelectedCategory(null)}
                    className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"
                  >
                    Change Category
                  </Button>
                </div>
              </div>

              {/* Program Creation Form */}
              <div className="space-y-4 sm:space-y-8">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 sm:space-y-8"
                  >
                    {/* Program Details Section */}
                    <div className="rounded-2xl border bg-card p-4 sm:p-8">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold">
                          Program Details
                        </h3>
                      </div>
                      <div className="space-y-4 sm:space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base sm:text-lg font-semibold">
                                Program Name
                              </FormLabel>
                              <FormControl>
                                {isCustomProgram ? (
                                  <Input
                                    className="w-full rounded-lg px-4 py-2.5 h-12 sm:h-14 bg-background border-2 border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                    placeholder="Enter your program name"
                                    {...field}
                                  />
                                ) : (
                                  <div className="relative">
                                    <select
                                      className="w-full rounded-lg px-4 py-2.5 h-12 sm:h-14 bg-background border-2 border-input text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                      value={field.value}
                                      onChange={(e) => {
                                        if (e.target.value === "custom") {
                                          setIsCustomProgram(true);
                                          field.onChange("");
                                        } else {
                                          setIsCustomProgram(false);
                                          field.onChange(e.target.value);
                                          // Auto-fill description based on template
                                          const template =
                                            selectedCategory &&
                                            PROGRAM_TEMPLATES[
                                              selectedCategory as keyof typeof PROGRAM_TEMPLATES
                                            ]?.find(
                                              (t) => t.name === e.target.value
                                            );
                                          if (template) {
                                            form.setValue(
                                              "description",
                                              template.description
                                            );
                                          }
                                        }
                                      }}
                                    >
                                      <option
                                        value=""
                                        className="bg-background text-foreground"
                                      >
                                        Select a template or create custom
                                      </option>
                                      <option
                                        value="custom"
                                        className="bg-background text-foreground"
                                      >
                                        Create Custom Program
                                      </option>
                                      {selectedCategory &&
                                        PROGRAM_TEMPLATES[
                                          selectedCategory as keyof typeof PROGRAM_TEMPLATES
                                        ]?.map((template) => (
                                          <option
                                            key={template.name}
                                            value={template.name}
                                            className="bg-background text-foreground"
                                          >
                                            {template.name}
                                          </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <svg
                                        className="h-4 w-4 text-muted-foreground"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base text-muted-foreground">
                                Description
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Program description and goals"
                                  className="min-h-[100px] sm:min-h-[120px] bg-background border-input"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Schedule Section */}
                    <div className="rounded-2xl border bg-card p-4 sm:p-8">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold">
                          Schedule
                        </h3>
                      </div>
                      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="schedule.startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">
                                Start Time
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="h-10 sm:h-12 bg-background border-input text-foreground"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="schedule.duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">
                                Duration (minutes)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="15"
                                  step="5"
                                  className="h-10 sm:h-12 bg-background border-input text-foreground"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4 sm:mt-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="schedule.repeat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">
                                Repeat
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <select
                                    className="w-full rounded-lg px-4 py-2.5 h-10 sm:h-12 bg-background border-2 border-input text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                    {...field}
                                  >
                                    <option
                                      value="none"
                                      className="bg-background text-foreground"
                                    >
                                      Don&apos;t repeat
                                    </option>
                                    <option
                                      value="daily"
                                      className="bg-background text-foreground"
                                    >
                                      Daily
                                    </option>
                                    <option
                                      value="weekly"
                                      className="bg-background text-foreground"
                                    >
                                      Weekly
                                    </option>
                                    <option
                                      value="monthly"
                                      className="bg-background text-foreground"
                                    >
                                      Monthly
                                    </option>
                                  </select>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg
                                      className="h-4 w-4 text-muted-foreground"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch("schedule.repeat") !== "none" && (
                          <FormField
                            control={form.control}
                            name="schedule.days"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm sm:text-base">
                                  Select Days
                                </FormLabel>
                                <FormControl>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      "Sun",
                                      "Mon",
                                      "Tue",
                                      "Wed",
                                      "Thu",
                                      "Fri",
                                      "Sat",
                                    ].map((day, index) => (
                                      <Button
                                        key={day}
                                        type="button"
                                        variant={
                                          field.value.includes(index)
                                            ? "default"
                                            : "outline"
                                        }
                                        className={`w-12 sm:w-16 h-10 sm:h-12 text-sm transition-all duration-200 ${
                                          field.value.includes(index)
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "bg-background border-2 border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                        onClick={() => {
                                          const days = field.value.includes(
                                            index
                                          )
                                            ? field.value.filter(
                                                (d) => d !== index
                                              )
                                            : [...field.value, index];
                                          field.onChange(days);
                                        }}
                                      >
                                        {day}
                                      </Button>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    {/* Exercises Section */}
                    <div className="rounded-2xl border bg-card p-4 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Dumbbell className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold">
                            Exercises
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {
                            availableExercises.filter(
                              (e) => e.category === selectedCategory
                            ).length
                          }{" "}
                          exercises available
                        </p>
                      </div>

                      <div className="space-y-4 sm:space-y-6">
                        {form.watch("exercises").map((_, index) => (
                          <div
                            key={index}
                            className="relative rounded-xl border-2 border-input bg-card p-4 sm:p-6 hover:border-primary/50 transition-all duration-200"
                          >
                            <div className="absolute -top-3 -left-3 flex items-center gap-2">
                              <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary text-xs sm:text-sm font-medium text-primary-foreground ring-2 ring-background">
                                {index + 1}
                              </span>
                            </div>

                            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`exercises.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm sm:text-base">
                                      Exercise Name
                                    </FormLabel>
                                    <FormControl>
                                      {isCustomExercise[index] ? (
                                        <Input
                                          className="w-full rounded-lg px-4 py-2.5 h-10 sm:h-12 bg-background border-2 border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                          placeholder="Enter your exercise name"
                                          {...field}
                                        />
                                      ) : (
                                        <div className="relative">
                                          <select
                                            className="w-full rounded-lg px-4 py-2.5 h-10 sm:h-12 bg-background border-2 border-input text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                            value={field.value}
                                            onChange={(e) => {
                                              if (e.target.value === "custom") {
                                                setIsCustomExercise((prev) => ({
                                                  ...prev,
                                                  [index]: true,
                                                }));
                                                field.onChange("");
                                                // Clear muscle group when switching to custom
                                                form.setValue(
                                                  `exercises.${index}.muscle_group`,
                                                  ""
                                                );
                                              } else {
                                                setIsCustomExercise((prev) => ({
                                                  ...prev,
                                                  [index]: false,
                                                }));
                                                field.onChange(e.target.value);
                                                // Auto-set muscle group based on exercise name
                                                const muscleGroup =
                                                  EXERCISE_MUSCLE_GROUPS[
                                                    e.target
                                                      .value as keyof typeof EXERCISE_MUSCLE_GROUPS
                                                  ];
                                                if (muscleGroup) {
                                                  form.setValue(
                                                    `exercises.${index}.muscle_group`,
                                                    muscleGroup
                                                  );
                                                }
                                              }
                                            }}
                                          >
                                            <option
                                              value=""
                                              className="bg-background text-foreground"
                                            >
                                              Select a template or create custom
                                            </option>
                                            <option
                                              value="custom"
                                              className="bg-background text-foreground"
                                            >
                                              Create Custom Exercise
                                            </option>
                                            {selectedCategory &&
                                              EXERCISE_TEMPLATES[
                                                selectedCategory as keyof typeof EXERCISE_TEMPLATES
                                              ]?.map((template) => (
                                                <option
                                                  key={template}
                                                  value={template}
                                                  className="bg-background text-foreground"
                                                >
                                                  {template}
                                                </option>
                                              ))}
                                          </select>
                                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg
                                              className="h-4 w-4 text-muted-foreground"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                      )}
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`exercises.${index}.muscle_group`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm sm:text-base">
                                      Muscle Group
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <select
                                          className="w-full rounded-lg px-4 py-2.5 h-10 sm:h-12 bg-background border-2 border-input text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                                          {...field}
                                        >
                                          <option
                                            value=""
                                            className="bg-background text-foreground"
                                          >
                                            Select muscle group
                                          </option>
                                          {selectedCategory === "strength" && (
                                            <>
                                              <option
                                                value="chest"
                                                className="bg-background text-foreground"
                                              >
                                                Chest
                                              </option>
                                              <option
                                                value="back"
                                                className="bg-background text-foreground"
                                              >
                                                Back
                                              </option>
                                              <option
                                                value="shoulders"
                                                className="bg-background text-foreground"
                                              >
                                                Shoulders
                                              </option>
                                              <option
                                                value="biceps"
                                                className="bg-background text-foreground"
                                              >
                                                Biceps
                                              </option>
                                              <option
                                                value="triceps"
                                                className="bg-background text-foreground"
                                              >
                                                Triceps
                                              </option>
                                              <option
                                                value="legs"
                                                className="bg-background text-foreground"
                                              >
                                                Legs
                                              </option>
                                              <option
                                                value="core"
                                                className="bg-background text-foreground"
                                              >
                                                Core
                                              </option>
                                            </>
                                          )}
                                          {selectedCategory ===
                                            "flexibility" && (
                                            <>
                                              <option
                                                value="upper_body"
                                                className="bg-background text-foreground"
                                              >
                                                Upper Body
                                              </option>
                                              <option
                                                value="lower_body"
                                                className="bg-background text-foreground"
                                              >
                                                Lower Body
                                              </option>
                                              <option
                                                value="full_body"
                                                className="bg-background text-foreground"
                                              >
                                                Full Body
                                              </option>
                                            </>
                                          )}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                          <svg
                                            className="h-4 w-4 text-muted-foreground"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 9l-7 7-7-7"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid gap-4 sm:gap-6 mt-4 sm:mt-6 md:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`exercises.${index}.sets`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm sm:text-base">
                                      Sets
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        className="h-10 sm:h-12 bg-background border-2 border-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={field.value || 3}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseInt(e.target.value) || 3
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`exercises.${index}.reps`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm sm:text-base">
                                      Reps
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., 8-12"
                                        className="h-10 sm:h-12 bg-background border-2 border-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={field.value || "8-12"}
                                        onChange={(e) =>
                                          field.onChange(e.target.value)
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`exercises.${index}.rest_time`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm sm:text-base">
                                      Rest Time (seconds)
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        className="h-10 sm:h-12 bg-background border-2 border-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={field.value || 60}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseInt(e.target.value) || 60
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`exercises.${index}.notes`}
                              render={({ field }) => (
                                <FormItem className="mt-4 sm:mt-6">
                                  <FormLabel className="text-sm sm:text-base">
                                    Notes
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Exercise notes, form cues, etc."
                                      className="min-h-[60px] sm:min-h-[80px] bg-background border-2 border-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end mt-4 sm:mt-6">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const exercises = form.getValues("exercises");
                                  if (exercises.length > 1) {
                                    form.setValue(
                                      "exercises",
                                      exercises.filter((_, i) => i !== index)
                                    );
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Exercise
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 sm:h-12 border-2 border-dashed hover:border-primary/50 transition-all duration-200"
                          onClick={() => {
                            const exercises = form.getValues("exercises");
                            form.setValue("exercises", [
                              ...exercises,
                              {
                                name: "",
                                sets: 3,
                                reps: "8-12",
                                rest_time: 60,
                                notes: "",
                                muscle_group: "",
                                equipment: [],
                              },
                            ]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Exercise
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="h-10 sm:h-12 px-6 sm:px-8"
                      >
                        Create Program
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>

            {/* Right Column - Programs and Progress */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-8">
              {/* Recent Programs */}
              <div className="rounded-2xl border bg-card p-4 sm:p-8">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">
                    Your Programs
                  </h3>
                </div>
                <div className="space-y-4">
                  {(() => {
                    // Filter out duplicate programs and only show programs for the selected category
                    const uniquePrograms = programs.filter(
                      (program, index, self) =>
                        index ===
                        self.findIndex(
                          (p) =>
                            p.name === program.name &&
                            p.description === program.description &&
                            program.exercises.some(
                              (exercise: Exercise) =>
                                exercise.category === selectedCategory ||
                                selectedCategory === "other"
                            )
                        )
                    );

                    return uniquePrograms.length > 0 ? (
                      uniquePrograms.map((program: WorkoutProgram) => (
                        <div
                          key={program.id}
                          className="group relative overflow-hidden rounded-xl border bg-card p-4 hover:bg-accent/50 transition-all duration-300"
                        >
                          <h3 className="font-medium mb-2">{program.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {program.description}
                          </p>
                          <div className="space-y-2">
                            {program.exercises.map((exercise: Exercise) => (
                              <div
                                key={exercise.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="flex items-center gap-2">
                                  <Dumbbell className="h-4 w-4 text-primary" />
                                  {exercise.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {exercise.sets} × {exercise.reps}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => startWorkout(program.id)}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Start Workout
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this program?"
                                  )
                                ) {
                                  const { error } = await supabase
                                    .from("workout_programs")
                                    .delete()
                                    .eq("id", program.id);

                                  if (error) {
                                    toast.error("Failed to delete program");
                                    return;
                                  }

                                  toast.success("Program deleted successfully");
                                  fetchPrograms();
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-medium text-lg mb-2">
                          No Programs Yet
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Create your first workout program to get started
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Progress Tracking */}
              <div className="rounded-2xl border bg-card p-4 sm:p-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold">
                      Recent Activity
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => router.push("/training/history")}
                  >
                    View All
                  </Button>
                </div>

                {recentWorkouts.length > 0 ? (
                  <div className="space-y-4">
                    {recentWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="group relative overflow-hidden rounded-xl border bg-card p-4 hover:bg-accent/50 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {workout.program_name}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              workout.completed_at
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              {Math.floor(workout.duration / 60)}m{" "}
                              {workout.duration % 60}s
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              {workout.exercises_completed}/
                              {workout.total_exercises} exercises
                            </span>
                          </div>
                        </div>

                        {workout.notes && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {workout.notes}
                          </p>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startWorkout(workout.program_id)}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Repeat Workout
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                    <div className="rounded-full bg-primary/10 p-3 sm:p-4 mb-4">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h3 className="font-medium text-base sm:text-lg mb-2">
                      No Recent Workouts
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                      Track your progress by completing workouts
                    </p>
                    {programs.length > 0 ? (
                      <Button
                        className="flex items-center gap-2 h-10 sm:h-12"
                        onClick={() => startWorkout(programs[0].id)}
                      >
                        <PlayCircle className="h-4 w-4" />
                        Start Workout
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Create a workout program to get started
                        </p>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 h-10 sm:h-12"
                          onClick={() => setSelectedCategory(null)}
                        >
                          <Plus className="h-4 w-4" />
                          Create Program
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
