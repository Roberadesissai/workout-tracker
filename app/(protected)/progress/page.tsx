"use client";

import { Target, Home, TrendingUp, Calendar, Activity } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/utils/supabase/client";

interface ProgressData {
  weeklyGoal: number;
  weeklyCompleted: number;
  monthlyProgress: number;
  streak: number;
  activityScore: number;
  latestWeight: number | null;
  weightChange: number;
  bodyFatChange: number;
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressData>({
    weeklyGoal: 3,
    weeklyCompleted: 0,
    monthlyProgress: 0,
    streak: 0,
    activityScore: 0,
    latestWeight: null,
    weightChange: 0,
    bodyFatChange: 0,
  });

  useEffect(() => {
    const fetchProgress = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get this week's workouts
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { data: weeklyWorkouts } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startOfWeek.toISOString());

        // Get progress tracking data
        const { data: progressData } = await supabase
          .from("progress_tracking")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(2);

        if (progressData && progressData.length > 0) {
          const latest = progressData[0];
          const previous = progressData[1];

          const weightChange = previous
            ? latest.weight_kg - previous.weight_kg
            : 0;
          const bodyFatChange =
            previous &&
            latest.body_fat_percentage &&
            previous.body_fat_percentage
              ? latest.body_fat_percentage - previous.body_fat_percentage
              : 0;

          setProgress((prev) => ({
            ...prev,
            weeklyCompleted: weeklyWorkouts?.length || 0,
            latestWeight: latest.weight_kg,
            weightChange,
            bodyFatChange,
          }));
        }

        // Calculate streak
        const { data: logs } = await supabase
          .from("workout_logs")
          .select("date")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(30);

        if (logs && logs.length > 0) {
          let currentStreak = 0;
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          for (let i = 0; i < logs.length; i++) {
            const logDate = new Date(logs[i].date);
            if (
              logDate.toDateString() === today.toDateString() ||
              logDate.toDateString() === yesterday.toDateString()
            ) {
              currentStreak++;
            } else {
              break;
            }
          }
          setProgress((prev) => ({ ...prev, streak: currentStreak }));
        }

        // Calculate monthly progress
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: monthlyWorkouts } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startOfMonth.toISOString());

        if (monthlyWorkouts) {
          const targetWorkouts = 12; // Example monthly target
          const progress = (monthlyWorkouts.length / targetWorkouts) * 100;
          setProgress((prev) => ({ ...prev, monthlyProgress: progress }));
        }
      }
    };

    fetchProgress();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
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
            <BreadcrumbPage>Progress</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 p-8">
          <div className="flex-1 min-w-[50%]">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Progress Tracking
              </h1>
            </div>
            <p className="text-muted-foreground">
              Monitor your fitness journey and track your achievements.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Progress.jpg"
              alt="Progress Tracking"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.weeklyCompleted}/{progress.weeklyGoal}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Workouts completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Progress
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.monthlyProgress.toFixed(0)}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Goal completion
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.streak} days</div>
            <p className="mt-1 text-xs text-muted-foreground">Current streak</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Change</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.weightChange > 0 ? "+" : ""}
              {progress.weightChange.toFixed(1)} kg
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Current: {progress.latestWeight?.toFixed(1) || "--"} kg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Body Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <div className="text-center">
                <p className="text-sm font-medium">No measurement data</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add your measurements to track progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Progress Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <div className="text-center">
                <p className="text-sm font-medium">No progress photos</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload photos to visualize your progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
