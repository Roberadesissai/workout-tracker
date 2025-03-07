"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ExerciseItem from "./ExerciseItem";
import { getLocalStorage, setLocalStorage, formatDate } from "@/lib/utils";
import { workouts } from "@/data/workouts";

interface WorkoutLogItem {
  completed: boolean;
  weights: string[];
}

const DailyLog: React.FC = () => {
  const today = new Date();
  const formattedDate = formatDate(today);
  const storageKey = `daily-routine-${formattedDate}`;

  const [dailyLog, setDailyLog] = useState<Record<string, WorkoutLogItem>>(
    () => {
      return getLocalStorage(storageKey, {});
    }
  );

  const dailyWorkout = workouts.Daily;

  const handleExerciseComplete = (
    exerciseName: string,
    data: WorkoutLogItem
  ) => {
    const newLog = {
      ...dailyLog,
      [exerciseName]: data,
    };

    setDailyLog(newLog);
    setLocalStorage(storageKey, newLog);
  };

  const completedCount = dailyWorkout.exercises.filter(
    (ex) => dailyLog[ex.name]?.completed
  ).length;

  const percentage = (completedCount / dailyWorkout.exercises.length) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground">Before-Bed Routine</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete these exercises before bed
        </p>

        <div className="flex items-center mt-2">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">
              {completedCount}/{dailyWorkout.exercises.length} completed
            </div>
            <div className="h-2 bg-secondary rounded-full mt-1">
              <div
                className="h-2 bg-primary rounded-full"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {dailyWorkout.exercises.map((exercise, index) => (
          <ExerciseItem
            key={index}
            exercise={exercise}
            onComplete={handleExerciseComplete}
            isCompleted={!!dailyLog[exercise.name]?.completed}
            workoutLog={dailyLog[exercise.name]}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default DailyLog;
