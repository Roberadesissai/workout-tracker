"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dumbbell,
  User,
  Flame,
  Trophy,
  ChevronRight,
  Timer,
  CalendarDays,
  Medal,
  Clock,
  Users,
  Sparkles,
  History,
  Target,
  Share2,
  X,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  achievements_count: number;
  personal_records: number;
  location: string | null;
  fitness_level: string | null;
  preferred_workout: string | null;
  username: string | null;
  bio: string | null;
  fitness_goals: string[] | null;
  preferred_workout_types: string[] | null;
  training_split: string | null;
  primary_fitness_focus: string | null;
  equipment_access: string[] | null;
  motivational_quote: string | null;
  total_workout_hours: number;
  certification_badges: string[] | null;
  preferred_workout_duration: number;
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  display_option: "email" | "username" | "full_name";
  role: "trainer" | "athlete" | null;
}

interface WorkoutData {
  id: string;
  program_id: string;
  completed_at: string;
  duration: number;
  exercises_completed: number;
  total_exercises: number;
  notes: string | null;
  program_name?: string;
  workout_programs?: {
    name: string;
  };
}

interface Follower {
  id: string;
  created_at: string;
  follower: {
    id: string;
    profiles: {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
    };
  };
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<string>("");
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutData[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<
    {
      id: string;
      name: string;
      scheduled_date: string;
    }[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all data in parallel
        const [
          profileResult,
          workoutLogsResult,
          exercisesResult,
          followersResult,
          upcomingResult,
        ] = await Promise.all([
          // Profile data
          supabase.from("profiles").select("*").eq("id", user.id).single(),

          // Workout logs for streak
          supabase
            .from("workout_logs")
            .select("date")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(30),

          // Recent exercises
          supabase
            .from("workout_history")
            .select(
              `
              id,
              program_id,
              completed_at,
              duration,
              exercises_completed,
              total_exercises,
              notes,
              workout_programs (
                name
              )
            `
            )
            .eq("user_id", user.id)
            .order("completed_at", { ascending: false })
            .limit(4),

          // Followers
          supabase
            .from("follows")
            .select(
              `
              id,
              created_at,
              follower_id,
              status,
              follower:profiles!follows_follower_id_fkey (
                profiles:profiles (
                  full_name,
                  username,
                  avatar_url
                )
              )
            `
            )
            .eq("following_id", user.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(3),

          // Upcoming workouts
          supabase
            .from("workout_programs")
            .select("id, name, scheduled_date")
            .eq("user_id", user.id)
            .limit(3),
        ]);

        // Handle profile data
        if (profileResult.error) throw profileResult.error;
        setProfile(profileResult.data);

        // Handle workout logs for streak
        if (workoutLogsResult.data && workoutLogsResult.data.length > 0) {
          let currentStreak = 0;
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          for (const log of workoutLogsResult.data) {
            const logDate = new Date(log.date);
            if (
              logDate.toDateString() === today.toDateString() ||
              logDate.toDateString() === yesterday.toDateString()
            ) {
              currentStreak++;
            } else break;
          }
          setStreak(currentStreak);
        }

        // Handle exercises
        if (exercisesResult.data) {
          const typedWorkouts = (
            exercisesResult.data as unknown as {
              id: string;
              program_id: string;
              completed_at: string;
              duration: number;
              exercises_completed: number;
              total_exercises: number;
              notes: string | null;
              workout_programs?: {
                name: string;
              };
            }[]
          ).map((workout) => ({
            id: String(workout.id),
            program_id: String(workout.program_id),
            completed_at: workout.completed_at,
            duration: Number(workout.duration),
            exercises_completed: Number(workout.exercises_completed),
            total_exercises: Number(workout.total_exercises),
            notes: workout.notes,
            program_name: workout.workout_programs?.name || "Custom Workout",
            workout_programs: workout.workout_programs,
          }));
          setRecentWorkouts(typedWorkouts);
        }

        // Handle followers
        if (followersResult.data) {
          const typedFollowers = (
            followersResult.data as unknown as {
              id: string;
              created_at: string;
              follower_id: string;
              status: string;
              follower: {
                profiles: {
                  full_name: string | null;
                  username: string | null;
                  avatar_url: string | null;
                };
              };
            }[]
          )
            .map((follow) => {
              if (!follow.follower?.profiles) return null;

              return {
                id: follow.id,
                created_at: follow.created_at,
                follower: {
                  id: follow.follower_id,
                  profiles: {
                    full_name: follow.follower.profiles.full_name || null,
                    username: follow.follower.profiles.username || null,
                    avatar_url: follow.follower.profiles.avatar_url || null,
                  },
                },
              };
            })
            .filter((follower): follower is Follower => follower !== null);

          setFollowers(typedFollowers);
        }

        // Handle upcoming workouts
        if (upcomingResult.data) {
          setUpcomingWorkouts(upcomingResult.data);
        }
      } catch (error: unknown) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("morning");
    else if (hour < 18) setTimeOfDay("afternoon");
    else setTimeOfDay("evening");
  }, []);

  const getDisplayName = () => {
    if (!profile) return "Athlete";

    switch (profile.display_option) {
      case "full_name":
        return profile.full_name || "Athlete";
      case "username":
        return profile.username || "Athlete";
      case "email":
        return profile.email?.split("@")[0] || "Athlete";
      default:
        return "Athlete";
    }
  };

  const handleFollowRequest = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    try {
      if (action === "accept") {
        const { error: updateError } = await supabase
          .from("follows")
          .update({ status: "accepted" })
          .eq("id", requestId);

        if (updateError) throw updateError;

        // Remove from local state
        setFollowers((prev) => prev.filter((f) => f.id !== requestId));
        toast.success("Follow request accepted");
      } else {
        const { error: deleteError } = await supabase
          .from("follows")
          .delete()
          .eq("id", requestId);

        if (deleteError) throw deleteError;

        // Remove from local state
        setFollowers((prev) => prev.filter((f) => f.id !== requestId));
        toast.success("Follow request rejected");
      }
    } catch (error) {
      console.error("Error handling follow request:", error);
      toast.error("Failed to process follow request");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-48 bg-muted rounded"></div>
          <div className="h-32 w-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
          <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
          <div className="relative p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-white/20 p-2">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {profile?.achievements_count || 0}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">Achievements</p>
            <p className="text-xs text-white/80">Total milestones reached</p>
            <div className="absolute bottom-1.5 right-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Trophy className="h-12 w-12 text-white/20" />
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
          <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
          <div className="relative p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-white/20 p-2">
                <Medal className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {profile?.personal_records || 0}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">Records</p>
            <p className="text-xs text-white/80">Personal bests achieved</p>
            <div className="absolute bottom-1.5 right-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Medal className="h-12 w-12 text-white/20" />
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300">
          <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
          <div className="relative p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-white/20 p-2">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {profile?.total_workout_hours || 0}h
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">Total Hours</p>
            <p className="text-xs text-white/80">Time spent training</p>
            <div className="absolute bottom-1.5 right-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Clock className="h-12 w-12 text-white/20" />
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300">
          <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
          <div className="relative p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-white/20 p-2">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {streak} days
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">Streak</p>
            <p className="text-xs text-white/80">Consecutive workouts</p>
            <div className="absolute bottom-1.5 right-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Flame className="h-12 w-12 text-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl h-[280px]">
            <div className="absolute inset-0">
              <Image
                src="/images/hero/placement—purely.jpg"
                alt="Dashboard Hero"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="relative h-full p-4 sm:p-8 flex flex-col justify-between">
              <div className="flex flex-row items-center gap-4 sm:gap-6">
                <div className="relative">
                  <Avatar className="relative h-16 w-16 sm:h-20 sm:w-20 shadow-xl ring-2 ring-primary/20 transition-transform duration-300 group-hover:scale-105">
                    {profile?.avatar_url ? (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={getDisplayName()}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {profile?.role === "trainer" && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] shadow-lg">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Trainer
                    </Badge>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-background flex items-center justify-center shadow-lg">
                    <div className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative backdrop-blur-md bg-black/20 rounded-2xl p-3 sm:p-4 border border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white">
                        Good {timeOfDay}
                      </span>
                      <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12">
                        <Image
                          src={
                            timeOfDay === "morning"
                              ? "/svg/Sun.svg"
                              : timeOfDay === "afternoon"
                              ? "/svg/Cloud_Sun.svg"
                              : "/svg/Moon.svg"
                          }
                          alt={`${timeOfDay} icon`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mt-2">
                      {getDisplayName()}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Motivational Quote */}
              {profile?.motivational_quote && (
                <div className="relative mt-auto bg-black/30 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-500/30 p-1.5 sm:p-2 group-hover:bg-blue-500/40 transition-colors">
                      <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-white/90 italic">
                        &ldquo;{profile.motivational_quote}&rdquo;
                      </p>
                      <p className="text-[8px] sm:text-[10px] text-white/70 mt-1.5">
                        Daily Motivation • Stay Focused
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 h-[520px]">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 ring-1 ring-primary/20">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Your completed workouts
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => router.push("/training/history")}
              >
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent
              className="space-y-3 h-[420px] pr-2 overflow-y-auto [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-primary/5
                [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/10
                hover:[&::-webkit-scrollbar-thumb]:bg-primary/20 dark:hover:[&::-webkit-scrollbar-thumb]:bg-primary/30
                [&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-200
                [&::-webkit-scrollbar]:hover:w-2"
            >
              {[0, 1, 2].map((index) => {
                const workout = recentWorkouts[index];

                if (!workout) {
                  return (
                    <div
                      key={`placeholder-${index}`}
                      className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800/50 shadow-md border border-gray-100 dark:border-gray-700/50 h-[130px]"
                    >
                      <div className="p-3 relative bg-gradient-to-br from-blue-400/80 to-blue-600/80">
                        <div className="absolute inset-0 opacity-10 bg-grid-white/10" />
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-white/20 p-2">
                              <Dumbbell className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                No Workout
                              </p>
                              <p className="text-xs text-white/80">
                                Start your fitness journey
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-800/30">
                        <div className="flex items-center gap-2">
                          <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-1.5">
                            <Timer className="h-3.5 w-3.5 text-blue-600/50 dark:text-blue-400/50" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-500/50 dark:text-gray-400/50">
                              Duration
                            </p>
                            <p className="text-sm font-medium text-gray-900/50 dark:text-gray-100/50">
                              -- m -- s
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-1.5">
                            <Dumbbell className="h-3.5 w-3.5 text-blue-600/50 dark:text-blue-400/50" />
                          </div>
                          <div className="space-y-0.5 text-right">
                            <p className="text-xs text-gray-500/50 dark:text-gray-400/50">
                              Exercises
                            </p>
                            <p className="text-sm font-medium text-gray-900/50 dark:text-gray-100/50">
                              --/--
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={workout.id}
                    className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800/50 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 h-[130px]"
                  >
                    <div className="p-3 relative bg-gradient-to-br from-blue-400 to-blue-600">
                      <div className="absolute inset-0 opacity-10 bg-grid-white/10" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-white/20 p-2">
                            <Dumbbell className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {workout.program_name}
                            </p>
                            <p className="text-xs text-white/80">
                              Completed •{" "}
                              {new Date(
                                workout.completed_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-3 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-800/30">
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-1.5">
                          <Timer className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Duration
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {Math.floor(workout.duration / 60)}m{" "}
                            {workout.duration % 60}s
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-1.5">
                          <Dumbbell className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-0.5 text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Exercises
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {workout.exercises_completed}/
                            {workout.total_exercises}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Workouts */}
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 ring-1 ring-primary/20">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">Upcoming Workouts</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Your scheduled training sessions
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingWorkouts.length > 0 ? (
                <ScrollArea
                  className="h-[280px] [&::-webkit-scrollbar]:w-2 
                  [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-primary/5
                  [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/10
                  hover:[&::-webkit-scrollbar-thumb]:bg-primary/20 dark:hover:[&::-webkit-scrollbar-thumb]:bg-primary/30
                  [&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-200
                  [&::-webkit-scrollbar]:hover:w-2"
                >
                  <div className="space-y-3">
                    {upcomingWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-colors p-4 dark:bg-opacity-20 bg-opacity-90"
                      >
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-primary/10 p-2 ring-1 ring-primary/20">
                              <CalendarDays className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium">
                              {workout.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {new Date(
                              workout.scheduled_date
                            ).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                  <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-3 opacity-50">
                      <Target className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No scheduled workouts</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Plan your next session
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Followers */}
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 ring-1 ring-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      Recent Followers
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      People following your journey
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => router.push("/settings/follow-requests")}
                >
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {followers.length > 0 ? (
                  <div className="space-y-4">
                    {followers.map((follow) => (
                      <div
                        key={follow.id}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-colors p-4 dark:bg-opacity-20 bg-opacity-90"
                      >
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={
                                  follow.follower.profiles.avatar_url ||
                                  undefined
                                }
                              />
                              <AvatarFallback>
                                {follow.follower.profiles.full_name?.[0] ||
                                  follow.follower.profiles.username?.[0] ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {follow.follower.profiles.full_name ||
                                  follow.follower.profiles.username ||
                                  "Unknown User"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Requested •{" "}
                                {new Date(
                                  follow.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleFollowRequest(follow.id, "reject")
                              }
                              className="h-8 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleFollowRequest(follow.id, "accept")
                              }
                              className="h-8"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                    <div className="text-center">
                      <div className="relative w-12 h-12 mx-auto mb-3 opacity-50">
                        <Users className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">No pending requests</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Share your profile to connect
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-6">
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 ring-1 ring-primary/20">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Start your fitness journey
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button
                  variant="ghost"
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 hover:opacity-90 transition-all h-[60px] w-full p-0"
                >
                  <div className="absolute inset-0 opacity-10 bg-grid-white/10" />
                  <div className="relative flex items-center gap-3 px-4">
                    <div className="rounded-xl bg-white/20 p-2 shrink-0">
                      <Dumbbell className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">
                      Start Workout
                    </span>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 hover:opacity-90 transition-all h-[60px] w-full p-0"
                >
                  <div className="absolute inset-0 opacity-10 bg-grid-white/10" />
                  <div className="relative flex items-center gap-3 px-4">
                    <div className="rounded-xl bg-white/20 p-2 shrink-0">
                      <CalendarDays className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">
                      Schedule
                    </span>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 hover:opacity-90 transition-all h-[60px] w-full p-0"
                >
                  <div className="absolute inset-0 opacity-10 bg-grid-white/10" />
                  <div className="relative flex items-center gap-3 px-4">
                    <div className="rounded-xl bg-white/20 p-2 shrink-0">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">
                      Find Partners
                    </span>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 hover:opacity-90 transition-all h-[60px] w-full p-0"
                >
                  <div className="absolute inset-0 opacity-10 bg-grid-white/10" />
                  <div className="relative flex items-center gap-3 px-4">
                    <div className="rounded-xl bg-white/20 p-2 shrink-0">
                      <Share2 className="h-4 w-4 text-white" />
                    </div>
                    
                    <span className="text-sm font-medium text-white">
                      Share Progress
                    </span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
