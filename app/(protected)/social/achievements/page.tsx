"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Trophy,
  Target,
  Dumbbell,
  Heart,
  Flame,
  Crown,
  Star,
  Home,
  Clock,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: "workout" | "nutrition" | "progress" | "social" | "special";
  requirements: {
    target: number;
    current: number;
  };
  points: number;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: {
    current: number;
    target: number;
  };
  completed: boolean;
  earned_at: string | null;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    totalPoints: 0,
    nextMilestone: "",
  });

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        // Fetch achievement types
        const { data: achievementTypes, error: achievementError } =
          await supabase.from("achievement_types").select("*");

        if (achievementError) throw achievementError;

        // Fetch user achievements
        const { data: userAchievs, error: userAchievError } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id);

        if (userAchievError) throw userAchievError;

        if (achievementTypes) {
          setAchievements(achievementTypes);

          const completed = userAchievs?.filter((a) => a.completed).length || 0;
          const points = userAchievs?.reduce((acc, curr) => {
            if (curr.completed) {
              const achievement = achievementTypes.find(
                (a) => a.id === curr.achievement_id
              );
              return acc + (achievement?.points || 0);
            }
            return acc;
          }, 0);

          const nextUnlocked = achievementTypes.find(
            (a) =>
              !userAchievs?.some(
                (ua) => ua.achievement_id === a.id && ua.completed
              )
          );

          setStats({
            totalAchievements: achievementTypes.length,
            completedAchievements: completed,
            totalPoints: points,
            nextMilestone: nextUnlocked?.name || "All achievements completed!",
          });
        }

        if (userAchievs) {
          setUserAchievements(userAchievs);
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
        toast.error("Failed to load achievements");
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const getCategoryIcon = (category: Achievement["category"]) => {
    switch (category) {
      case "workout":
        return <Dumbbell className="h-5 w-5 text-primary" />;
      case "nutrition":
        return <Heart className="h-5 w-5 text-primary" />;
      case "progress":
        return <Target className="h-5 w-5 text-primary" />;
      case "social":
        return <Star className="h-5 w-5 text-primary" />;
      case "special":
        return <Crown className="h-5 w-5 text-primary" />;
      default:
        return <Trophy className="h-5 w-5 text-primary" />;
    }
  };

  const categories = Array.from(
    new Set(achievements.map((a) => a.category))
  ).sort();

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
            <BreadcrumbLink href="/social">Social</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Achievements</BreadcrumbPage>
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
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Achievements
              </h1>
            </div>
            <p className="text-muted-foreground">
              Track your fitness milestones and unlock achievements as you
              progress towards your goals.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Achievements.jpg"
              alt="Achievements"
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
            <CardTitle className="text-sm font-medium">
              Total Achievements
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAchievements}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Available to unlock
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Star className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedAchievements}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Achievements unlocked
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Crown className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Achievement points earned
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Next Milestone
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {stats.nextMilestone}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Achievement to unlock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Categories */}
      {loading ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            </div>
            <h3 className="font-medium mb-2">Loading Achievements...</h3>
          </div>
        </Card>
      ) : achievements.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Achievements Available</h3>
            <p className="text-sm text-muted-foreground">
              Start your fitness journey to unlock achievements.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            {categories.map((category) => {
              const categoryAchievements = achievements.filter(
                (a) => a.category === category
              );

              if (categoryAchievements.length === 0) return null;

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    {getCategoryIcon(category as Achievement["category"])}
                    <h2 className="text-lg font-semibold capitalize">
                      {category}
                    </h2>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({categoryAchievements.length} achievements)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                    {categoryAchievements.map((achievement) => {
                      const userAchievement = userAchievements.find(
                        (ua) => ua.achievement_id === achievement.id
                      );
                      const progress = userAchievement?.progress.current || 0;
                      const target = achievement.requirements.target;
                      const progressPercentage = Math.min(
                        (progress / target) * 100,
                        100
                      );

                      return (
                        <Card
                          key={achievement.id}
                          className={`p-4 transition-colors duration-200 h-full flex flex-col ${
                            userAchievement?.completed
                              ? "bg-primary/5 border-primary/20"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-4 flex-grow">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                userAchievement?.completed
                                  ? "bg-primary/20"
                                  : "bg-primary/10"
                              }`}
                            >
                              {getCategoryIcon(achievement.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium truncate">
                                  {achievement.name}
                                </h3>
                                {userAchievement?.completed && (
                                  <Badge
                                    variant="default"
                                    className="ml-2 bg-primary/20 text-primary whitespace-nowrap"
                                  >
                                    Unlocked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-auto space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Progress
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {progress}/{target}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({achievement.points} pts)
                                </span>
                              </div>
                            </div>
                            <Progress
                              value={progressPercentage}
                              className={`h-2 ${
                                userAchievement?.completed
                                  ? "bg-primary/20"
                                  : "bg-primary/10"
                              }`}
                            />
                            {userAchievement?.completed && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Earned{" "}
                                {new Date(
                                  userAchievement.earned_at!
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
