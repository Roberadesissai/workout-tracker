"use client";

import {
  Activity as ActivityIcon,
  Home,
  Target,
  Heart,
  Footprints,
  Timer,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ActivityData {
  steps: number;
  distance: number;
  activeMinutes: number;
  caloriesBurned: number;
  dailyGoal: {
    steps: number;
    activeMinutes: number;
    calories: number;
  };
}

export default function ActivityPage() {
  // Using placeholder data for now
  const [activityData] = useState<ActivityData>({
    steps: 7500,
    distance: 5.2,
    activeMinutes: 45,
    caloriesBurned: 350,
    dailyGoal: {
      steps: 10000,
      activeMinutes: 60,
      calories: 500,
    },
  });

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
            <BreadcrumbLink href="/health">Health</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Activity</BreadcrumbPage>
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
                <ActivityIcon className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Daily Activity
              </h1>
            </div>
            <p className="text-muted-foreground">
              Track your daily movement and stay active throughout the day.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Activity.jpg"
              alt="Daily Activity"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Footprints className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityData.steps.toLocaleString()}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex text-xs justify-between">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {Math.round(
                    (activityData.steps / activityData.dailyGoal.steps) * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  (activityData.steps / activityData.dailyGoal.steps) * 100
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityData.distance.toFixed(2)} km
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Daily movement</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Minutes
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Timer className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityData.activeMinutes}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex text-xs justify-between">
                <span className="text-muted-foreground">
                  Goal: {activityData.dailyGoal.activeMinutes} min
                </span>
                <span className="font-medium">
                  {Math.round(
                    (activityData.activeMinutes /
                      activityData.dailyGoal.activeMinutes) *
                      100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  (activityData.activeMinutes /
                    activityData.dailyGoal.activeMinutes) *
                  100
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Heart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityData.caloriesBurned}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex text-xs justify-between">
                <span className="text-muted-foreground">
                  Goal: {activityData.dailyGoal.calories} cal
                </span>
                <span className="font-medium">
                  {Math.round(
                    (activityData.caloriesBurned /
                      activityData.dailyGoal.calories) *
                      100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  (activityData.caloriesBurned /
                    activityData.dailyGoal.calories) *
                  100
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="text-center">
              <ActivityIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Track Your Progress</h3>
              <p className="text-sm text-muted-foreground">
                Your activity data will be displayed here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Zones */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Activity Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Activity zones will be available soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
