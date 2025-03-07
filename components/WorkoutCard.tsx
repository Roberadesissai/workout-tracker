"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ExerciseItem from "./ExerciseItem";
import { Button } from "@/components/ui/button";
import { getLocalStorage, setLocalStorage, formatDate } from "@/lib/utils";

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  time?: string;
  note?: string;
  type: "primary" | "optional" | "cardio" | "circuit" | "daily";
  category?: string;
}

interface Workout {
  name: string;
  exercises: Exercise[];
}

interface WorkoutLogItem {
  completed: boolean;
  weights: string[];
}

interface WorkoutCardProps {
  day: string;
  date?: Date;
  workout: Workout | null;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ day, date, workout }) => {
  const storageKey = `workout-log-${date ? formatDate(date) : day}`;

  const [expanded, setExpanded] = useState(true);
  const [workoutLog, setWorkoutLog] = useState<Record<string, WorkoutLogItem>>(
    () => {
      const savedLog = getLocalStorage(storageKey, {});
      return savedLog;
    }
  );

  const [completionStatus, setCompletionStatus] = useState(() => {
    const exercises = workout?.exercises || [];
    const completedCount = exercises.filter(
      (ex) => workoutLog[ex.name]?.completed
    ).length;

    return {
      total: exercises.length,
      completed: completedCount,
      percentage: exercises.length
        ? (completedCount / exercises.length) * 100
        : 0,
    };
  });

  useEffect(() => {
    const exercises = workout?.exercises || [];
    const completedCount = exercises.filter(
      (ex) => workoutLog[ex.name]?.completed
    ).length;

    setCompletionStatus({
      total: exercises.length,
      completed: completedCount,
      percentage: exercises.length
        ? (completedCount / exercises.length) * 100
        : 0,
    });
  }, [workoutLog, workout]);

  const handleExerciseComplete = (
    exerciseName: string,
    data: WorkoutLogItem
  ) => {
    const newLog = {
      ...workoutLog,
      [exerciseName]: data,
    };

    setWorkoutLog(newLog);
    setLocalStorage(storageKey, newLog);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const resetWorkout = () => {
    if (confirm("Are you sure you want to reset this workout?")) {
      setWorkoutLog({});
      setLocalStorage(storageKey, {});
    }
  };

  if (!workout) {
    return (
      <Card className="mb-4">
        <div className="p-4 text-center text-muted-foreground">
          No workout scheduled for {day}
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden bg-card">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          <div className="mr-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {day.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {day}: {workout.name}
            </h3>
            {date && (
              <p className="text-sm text-muted-foreground">
                {formatDate(date)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <div className="mr-4">
            <div className="text-sm text-muted-foreground">
              {completionStatus.completed}/{completionStatus.total} completed
            </div>
            <div className="w-32 h-2 bg-secondary rounded-full mt-1">
              <div
                className="h-2 bg-primary rounded-full"
                style={{ width: `${completionStatus.percentage}%` }}
              ></div>
            </div>
          </div>
          <div className="text-muted-foreground">{expanded ? "▲" : "▼"}</div>
        </div>
      </div>

      {expanded && (
        <>
          <div className="border-t border-border">
            {workout.exercises.map((exercise, index) => (
              <ExerciseItem
                key={index}
                exercise={exercise}
                onComplete={handleExerciseComplete}
                isCompleted={!!workoutLog[exercise.name]?.completed}
                workoutLog={workoutLog[exercise.name]}
              />
            ))}
          </div>
          <div className="p-3 bg-muted border-t border-border flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={resetWorkout}
              className="mr-2"
            >
              Reset
            </Button>
            <Button
              variant={
                completionStatus.percentage === 100 ? "default" : "default"
              }
              size="sm"
            >
              {completionStatus.percentage === 100 ? "Completed!" : "Save"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default WorkoutCard;
