"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeekDates, getLocalStorage, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface DayStats {
  day: string;
  date: string;
  completed: number;
  originalDate: Date;
}

interface WorkoutLogItem {
  completed: boolean;
  weights: string[];
}

const ProgressTracker: React.FC = () => {
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);
  const router = useRouter();

  useEffect(() => {
    const weekDates = getWeekDates();
    const stats = weekDates.map(({ date, dayName }) => {
      const formattedDate = formatDate(date);
      const storageKey = `workout-log-${formattedDate}`;
      const workoutLog = getLocalStorage(storageKey, {}) as Record<
        string,
        WorkoutLogItem
      >;

      const completedCount = Object.values(workoutLog).filter(
        (item) => item.completed
      ).length;

      return {
        day: dayName,
        date: formattedDate,
        completed: completedCount,
        originalDate: date,
      };
    });

    setWeekStats(stats);
  }, []);

  const totalCompleted = weekStats.reduce((sum, day) => sum + day.completed, 0);

  const handleDayClick = (day: DayStats) => {
    if (day.day === "Saturday" || day.day === "Sunday") return;
    router.push(`/workout/${day.day.toLowerCase()}`);
  };

  return (
    <Card className="mb-12 bg-gradient-to-br from-background to-muted shadow-lg">
      <CardHeader className="pb-3 space-y-1">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
          Weekly Progress
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          You&apos;ve completed {totalCompleted} exercises this week
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Weekly Stats Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekStats.map((day, index) => {
            const isRestDay = day.day === "Saturday" || day.day === "Sunday";
            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  flex flex-col items-center p-3 rounded-xl border transition-all duration-200
                  ${
                    isRestDay
                      ? "bg-muted/30 border-border/30 cursor-default"
                      : "bg-card border-border/50 hover:border-primary/50 hover:shadow-md active:scale-95 cursor-pointer"
                  }
                `}
              >
                <div className="text-sm font-medium text-muted-foreground">
                  {day.day.slice(0, 3)}
                </div>
                <div
                  className={`
                    mt-2 w-10 h-10 rounded-xl flex items-center justify-center
                    text-sm font-medium transition-all duration-200
                    ${
                      isRestDay
                        ? "bg-secondary/40 text-secondary-foreground text-xs uppercase tracking-wider"
                        : day.completed > 0
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground"
                    }
                  `}
                >
                  <span className={isRestDay ? "opacity-80" : ""}>
                    {isRestDay ? "Rest" : day.completed}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 bg-muted/20 p-4 rounded-lg border border-border/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Weekly Target</span>
            <span className="text-foreground font-medium">
              {totalCompleted} / 21 exercises
            </span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden border border-border/50">
            <div
              className="h-full bg-primary/80 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((totalCompleted / 21) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
