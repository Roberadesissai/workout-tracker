"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import WorkoutCard from "@/components/WorkoutCard";
import ProgressTracker from "@/components/ProgressTracker";
import DailyLog from "@/components/DailyLog";
import { getCurrentDay, getWeekDates } from "@/lib/utils";
import { getWorkoutForDay } from "@/data/workouts";

export default function Home() {
  const [currentDay, setCurrentDay] = useState<string>("");
  const [weekDates, setWeekDates] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"week" | "today">("today");

  useEffect(() => {
    setCurrentDay(getCurrentDay());
    setWeekDates(getWeekDates());
  }, []);

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">My Workout Plan</h2>

          <div className="flex items-center">
            <button
              onClick={() => setViewMode("today")}
              className={`px-3 py-1 rounded-l-md border border-gray-300 ${
                viewMode === "today"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-r-md border border-gray-300 border-l-0 ${
                viewMode === "week"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              This Week
            </button>
          </div>
        </div>

        <ProgressTracker />

        {viewMode === "today" ? (
          <>
            <WorkoutCard
              day={currentDay}
              workout={getWorkoutForDay(currentDay)}
            />
            <DailyLog />
          </>
        ) : (
          <>
            {weekDates.map((dateInfo, index) => (
              <WorkoutCard
                key={index}
                day={dateInfo.dayName}
                date={dateInfo.date}
                workout={getWorkoutForDay(dateInfo.dayName)}
              />
            ))}
            <DailyLog />
          </>
        )}
      </div>
    </main>
  );
}
