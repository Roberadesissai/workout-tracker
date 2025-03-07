"use client";

import {
  Home,
  Dumbbell,
  Timer,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Clock,
  Flame,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkoutTracker } from "../planner/components/workout-tracker";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Exercise {
  id: string;
  name: string;
  category: string;
  sets: number;
  reps: string;
  rest_time: number;
  notes?: string;
}

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  recurrence: {
    repeat: "none" | "daily" | "weekly" | "monthly";
    startTime: string;
    days: number[];
    duration: number;
  } | null;
}

interface WorkoutExerciseData {
  id: string;
  sets: number;
  reps: string;
  rest_time: number;
  notes?: string;
  exercise?: {
    id: string;
    name: string;
    category: string;
  };
}

interface WorkoutCompletion {
  duration: number;
  exercisesCompleted: number;
  totalExercises: number;
  notes: string;
  achievements: {
    title: string;
    description: string;
    icon: string;
  }[];
}

export default function WorkoutPage() {
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [workoutCompletion, setWorkoutCompletion] =
    useState<WorkoutCompletion | null>(null);

  useEffect(() => {
    fetchProgram();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive && !isPaused && !isResting) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, isPaused, isResting]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const startRest = useCallback((duration: number) => {
    setRestTimer(duration);
    setIsResting(true);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises((prev) => [...prev, exerciseId]);
    if (
      activeProgram &&
      currentExerciseIndex < activeProgram.exercises.length - 1
    ) {
      const nextExercise = activeProgram.exercises[currentExerciseIndex + 1];
      startRest(nextExercise.rest_time);
      setCurrentExerciseIndex((prev) => prev + 1);
    }
  };

  const calculateAchievements = (
    duration: number,
    exercisesCompleted: number,
    totalExercises: number
  ) => {
    const achievements = [];

    // Time-based achievements
    if (duration >= 3600) {
      achievements.push({
        title: "Endurance Master",
        description: "Completed a workout lasting over 1 hour",
        icon: "⏱️",
      });
    } else if (duration >= 1800) {
      achievements.push({
        title: "Dedicated Athlete",
        description: "Completed a 30+ minute workout",
        icon: "💪",
      });
    }

    // Completion-based achievements
    if (exercisesCompleted === totalExercises) {
      achievements.push({
        title: "Perfectionist",
        description: "Completed all planned exercises",
        icon: "🎯",
      });
    }

    return achievements;
  };

  const handleWorkoutComplete = async () => {
    if (!activeProgram) return;

    try {
      const duration = elapsedTime;
      const exercisesCompleted = completedExercises.length;
      const totalExercises = activeProgram.exercises.length;
      const achievements = calculateAchievements(
        duration,
        exercisesCompleted,
        totalExercises
      );

      setWorkoutCompletion({
        duration,
        exercisesCompleted,
        totalExercises,
        notes: workoutNotes,
        achievements,
      });

      await recordWorkoutCompletion(
        activeProgram.id,
        duration,
        exercisesCompleted,
        totalExercises,
        workoutNotes
      );

      // Don't close dialog or redirect yet - let user see achievements
    } catch (error) {
      console.error("Error completing workout:", error);
      toast.error("Failed to save workout completion");
    }
  };

  const finishAndNavigate = (destination: "history" | "progress") => {
    setShowCompleteDialog(false);
    setWorkoutCompletion(null);
    router.push(`/training/${destination}`);
  };

  const fetchProgram = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to view your workout");
        return;
      }

      console.log("Fetching workout program for user:", user.id);

      // Get program ID from URL
      const params = new URLSearchParams(window.location.search);
      const programId = params.get("program");

      if (!programId) {
        console.error("No program ID provided");
        return;
      }

      // Fetch the program and its exercises
      const { data: program, error: programError } = await supabase
        .from("workout_programs")
        .select(
          `
          *,
          workout_exercises:workout_exercises(
            id,
            sets,
            reps,
            rest_time,
            notes,
            exercise:exercises(
              id,
              name,
              category
            )
          )
        `
        )
        .eq("id", programId)
        .eq("user_id", user.id)
        .single();

      if (programError) {
        console.error("Error fetching program:", programError);
        toast.error("Failed to load workout program");
        return;
      }

      if (!program) {
        console.error("Program not found");
        toast.error("Workout program not found");
        return;
      }

      console.log("Fetched program:", program);

      // Format the program data
      const formattedProgram: WorkoutProgram = {
        id: program.id,
        name: program.name,
        description: program.description,
        recurrence: program.recurrence,
        exercises: program.workout_exercises.map((ex: WorkoutExerciseData) => ({
          id: ex.id,
          name: ex.exercise?.name || "Unknown Exercise",
          category: ex.exercise?.category || "other",
          sets: ex.sets || 3,
          reps: ex.reps || "8-12",
          rest_time: ex.rest_time || 60,
          notes: ex.notes,
        })),
      };

      setActiveProgram(formattedProgram);
    } catch (err) {
      console.error("Error in fetchProgram:", err);
      toast.error("Failed to load workout");
    } finally {
      setLoading(false);
    }
  };

  const recordWorkoutCompletion = async (
    programId: string,
    duration: number,
    exercisesCompleted: number,
    totalExercises: number,
    notes: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase.from("workout_history").insert({
      user_id: user.id,
      program_id: programId,
      duration,
      exercises_completed: exercisesCompleted,
      total_exercises: totalExercises,
      notes,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="animate-spin">
                <Timer className="h-5 w-5 text-muted-foreground" />
              </div>
              <p>Loading workout...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeProgram) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Active Program</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Select a workout program to get started.
            </p>
            <Button onClick={() => router.push("/training/workouts")}>
              View Workouts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentExercise = activeProgram.exercises[currentExerciseIndex];
  const progress =
    (completedExercises.length / activeProgram.exercises.length) * 100;

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb - Hide on mobile */}
      <div className="hidden sm:block">
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
              <BreadcrumbLink href="/training/workouts">
                Workouts
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Active Workout</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/Mid-Workout_Intensity.jpg"
            alt="Active Workout"
            fill
            className="object-cover opacity-15"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/20" />
        </div>
        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 backdrop-blur-sm p-3">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {activeProgram.name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeProgram.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="text-center w-full sm:w-auto">
                  <div className="text-xl sm:text-2xl font-bold font-mono backdrop-blur-sm bg-background/30 rounded-lg px-4 py-2">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Elapsed Time
                  </div>
                </div>
                <Button
                  variant={
                    isWorkoutActive
                      ? isPaused
                        ? "outline"
                        : "destructive"
                      : "default"
                  }
                  size="lg"
                  onClick={() => {
                    if (!isWorkoutActive) {
                      setIsWorkoutActive(true);
                    } else {
                      setIsPaused(!isPaused);
                    }
                  }}
                  className="w-full sm:w-auto min-w-[120px]"
                >
                  {!isWorkoutActive ? (
                    <>
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Start
                    </>
                  ) : isPaused ? (
                    <>
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <PauseCircle className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 sm:mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedExercises.length} of{" "}
                  {activeProgram.exercises.length} exercises
                </span>
              </div>
              <div className="h-2 bg-muted/50 backdrop-blur-sm rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Exercise */}
      {isResting ? (
        <Card className="bg-muted">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Timer className="h-10 sm:h-12 w-10 sm:w-12 text-primary mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              Rest Period
            </h3>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-primary mb-4">
              {formatTime(restTimer)}
            </div>
            <p className="text-sm text-muted-foreground text-center px-4">
              Next up: {activeProgram.exercises[currentExerciseIndex + 1]?.name}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsResting(false)}
            >
              Skip Rest
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {currentExerciseIndex + 1}
                </div>
                <span className="text-base sm:text-lg">
                  {currentExercise.name}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-11 sm:ml-0">
                <span className="text-sm text-muted-foreground">
                  {currentExercise.sets} sets × {currentExercise.reps}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentExercise.notes && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  {currentExercise.notes}
                </p>
              </div>
            )}
            <WorkoutTracker
              exerciseId={currentExercise.id}
              sets={currentExercise.sets}
              reps={currentExercise.reps}
              onComplete={() => handleExerciseComplete(currentExercise.id)}
              isCompleted={completedExercises.includes(currentExercise.id)}
            />
          </CardContent>
        </Card>
      )}

      {/* Workout Notes */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <h3 className="font-medium">Workout Notes</h3>
            <Textarea
              placeholder="Add notes about your workout performance, how you felt, etc..."
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Complete Workout Button */}
      {isWorkoutActive &&
        completedExercises.length === activeProgram.exercises.length && (
          <div className="flex justify-end px-4 sm:px-0">
            <Button
              size="lg"
              onClick={() => setShowCompleteDialog(true)}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Complete Workout
            </Button>
          </div>
        )}

      {/* Complete Workout Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Workout Complete!
            </DialogTitle>
            <DialogDescription>
              Congratulations on completing your workout! Here's a summary of
              your session.
            </DialogDescription>
          </DialogHeader>

          {!workoutCompletion ? (
            // Initial confirmation view
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(elapsedTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <Flame className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Exercises Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {completedExercises.length} of{" "}
                    {activeProgram?.exercises.length}
                  </p>
                </div>
              </div>
              <DialogFooter className="sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleWorkoutComplete}>
                  Complete Workout
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // Completion celebration view
            <div className="space-y-6 py-4">
              {/* Workout Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(workoutCompletion.duration)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <Flame className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Completion Rate</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(
                        (workoutCompletion.exercisesCompleted /
                          workoutCompletion.totalExercises) *
                          100
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              {workoutCompletion.achievements.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Achievements Unlocked!</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {workoutCompletion.achievements.map(
                      (achievement, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                        >
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <p className="font-medium">{achievement.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Options */}
              <div className="pt-4">
                <h4 className="font-medium mb-3">
                  What would you like to do next?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => finishAndNavigate("history")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    View Workout History
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => finishAndNavigate("progress")}
                  >
                    <Flame className="mr-2 h-4 w-4" />
                    Check Your Progress
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
