"use client";

import {
  BarChart2,
  Home,
  Activity,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";
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

interface AnalyticsData {
  totalWorkouts: number;
  completionRate: number;
  avgDuration: number;
  activeWeeks: number;
}

// Helper function to get week number
const getWeek = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalWorkouts: 0,
    completionRate: 0,
    avgDuration: 0,
    activeWeeks: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch workout logs
        const { data: workoutLogs } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", user.id);

        if (workoutLogs) {
          // Calculate analytics
          const total = workoutLogs.length;
          const completed = workoutLogs.filter(
            (log) => log.completed_at
          ).length;
          const totalDuration = workoutLogs.reduce((acc, log) => {
            const duration = log.completed_at
              ? (new Date(log.completed_at).getTime() -
                  new Date(log.date).getTime()) /
                (1000 * 60)
              : 0;
            return acc + duration;
          }, 0);

          // Get unique weeks
          const uniqueWeeks = new Set(
            workoutLogs.map((log) => {
              const date = new Date(log.date);
              return `${date.getFullYear()}-${getWeek(date)}`;
            })
          );

          setAnalytics({
            totalWorkouts: total,
            completionRate: total ? (completed / total) * 100 : 0,
            avgDuration: total ? totalDuration / total : 0,
            activeWeeks: uniqueWeeks.size,
          });
        }
      }
    };

    fetchAnalytics();
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
            <BreadcrumbPage>Analytics</BreadcrumbPage>
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
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            </div>
            <p className="text-muted-foreground">
              Track your fitness progress and analyze your performance metrics.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Analytics.jpg"
              alt="Analytics Overview"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Workouts
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalWorkouts}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              All-time workouts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.completionRate.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Workout completion
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analytics.avgDuration)} min
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Per workout</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Weeks</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeWeeks}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Weeks with workouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <div className="text-center">
                <p className="text-sm font-medium">No trend data available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete more workouts to see your performance trends
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Workout Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <div className="text-center">
                <p className="text-sm font-medium">No distribution data</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Track different workout types to see distribution
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
