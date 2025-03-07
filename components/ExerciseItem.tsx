"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  time?: string;
  note?: string;
  type: "primary" | "optional" | "cardio" | "circuit" | "daily";
  category?: string;
}

interface WorkoutLogItem {
  completed: boolean;
  weights: string[];
}

interface ExerciseItemProps {
  exercise: Exercise;
  onComplete: (name: string, data: WorkoutLogItem) => void;
  isCompleted: boolean;
  workoutLog?: WorkoutLogItem;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  onComplete,
  isCompleted,
  workoutLog,
}) => {
  const [weights, setWeights] = useState<string[]>(
    workoutLog?.weights || Array(exercise.sets || 1).fill("")
  );

  const handleWeightChange = (index: number, value: string) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
    if (onComplete) {
      onComplete(exercise.name, {
        completed: isCompleted,
        weights: newWeights,
      });
    }
  };

  const handleCheckboxChange = () => {
    if (onComplete) {
      onComplete(exercise.name, {
        completed: !isCompleted,
        weights,
      });
    }
  };

  const getTypeLabel = () => {
    switch (exercise.type) {
      case "optional":
        return (
          <span className="text-xs font-medium text-gray-500 ml-2">
            (Optional)
          </span>
        );
      case "cardio":
        return (
          <span className="text-xs font-medium text-blue-500 ml-2">
            (Cardio)
          </span>
        );
      case "circuit":
        return (
          <span className="text-xs font-medium text-purple-500 ml-2">
            (Circuit)
          </span>
        );
      case "daily":
        return (
          <span className="text-xs font-medium text-green-500 ml-2">
            (Daily)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`p-3 border-b border-gray-100 ${
        isCompleted ? "bg-green-50" : ""
      }`}
    >
      <div className="flex items-start">
        <Checkbox
          id={`exercise-${exercise.name}`}
          checked={isCompleted}
          onCheckedChange={handleCheckboxChange}
          className="mt-1"
        />
        <div className="ml-2 flex-1">
          <div className="flex flex-wrap items-baseline">
            <span
              className={`font-medium ${
                isCompleted ? "line-through text-gray-500" : "text-gray-800"
              }`}
            >
              {exercise.name}
            </span>
            {getTypeLabel()}
          </div>

          <div className="text-sm text-gray-600 mt-1">
            {exercise.sets && exercise.reps && (
              <span>
                {exercise.sets} sets × {exercise.reps} reps
              </span>
            )}
            {exercise.time && <span>{exercise.time}</span>}
            {exercise.note && (
              <p className="text-xs italic mt-1">{exercise.note}</p>
            )}
          </div>

          {exercise.sets &&
            exercise.type !== "cardio" &&
            exercise.type !== "circuit" && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Array.from({ length: exercise.sets }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-xs text-gray-500 mr-1">
                      Set {index + 1}:
                    </span>
                    <Input
                      type="text"
                      value={weights[index] || ""}
                      onChange={(e) =>
                        handleWeightChange(index, e.target.value)
                      }
                      placeholder="lbs"
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseItem;
