"use client";

import { useState, useEffect } from "react";
import {
  Home,
  Clock,
  Calendar,
  ChevronDown,
  Filter,
  BarChart3,
  Dumbbell,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

interface WorkoutHistory {
  id: string;
  program_id: string;
  completed_at: string;
  duration: number;
  exercises_completed: number;
  total_exercises: number;
  notes: string;
  program: {
    name: string;
    description: string;
    recurrence: {
      repeat: "none" | "daily" | "weekly" | "monthly";
      startTime: string;
      days: number[];
      duration: number;
    } | null;
  };
}

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filters, setFilters] = useState({
    timeRange: [] as string[],
    completion: [] as string[],
    category: [] as string[],
    duration: [] as string[],
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to view your workout history");
        return;
      }

      const { data, error } = await supabase
        .from("workout_history")
        .select(
          `
          *,
          program:workout_programs(
            name,
            description,
            recurrence
          )
        `
        )
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("Error fetching workout history:", error);
        toast.error("Failed to load workout history");
        return;
      }

      setWorkouts(data || []);
    } catch (err) {
      console.error("Error in fetchWorkoutHistory:", err);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (newFilters[type].includes(value)) {
        newFilters[type] = newFilters[type].filter((v) => v !== value);
      } else {
        newFilters[type] = [...newFilters[type], value];
      }
      return newFilters;
    });

    setActiveFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  };

  const clearFilters = () => {
    setFilters({
      timeRange: [],
      completion: [],
      category: [],
      duration: [],
    });
    setActiveFilters([]);
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    workouts.forEach((workout) => {
      if (workout.program.recurrence?.repeat) {
        categories.add(workout.program.recurrence.repeat);
      }
    });
    return Array.from(categories);
  };

  const filteredWorkouts = workouts.filter((workout) => {
    const now = new Date();
    const workoutDate = new Date(workout.completed_at);
    const daysDiff = Math.floor(
      (now.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Search query filter
    const matchesSearch =
      searchQuery === "" ||
      workout.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.program.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      workout.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    // Time range filter
    const matchesTimeRange =
      filters.timeRange.length === 0 ||
      (filters.timeRange.includes("today") && daysDiff === 0) ||
      (filters.timeRange.includes("week") && daysDiff <= 7) ||
      (filters.timeRange.includes("month") && daysDiff <= 30);

    // Completion filter
    const completionRate =
      (workout.exercises_completed / workout.total_exercises) * 100;
    const matchesCompletion =
      filters.completion.length === 0 ||
      (filters.completion.includes("complete") && completionRate === 100) ||
      (filters.completion.includes("partial") && completionRate < 100);

    // Category filter
    const matchesCategory =
      filters.category.length === 0 ||
      (workout.program.recurrence?.repeat &&
        filters.category.includes(workout.program.recurrence.repeat));

    // Duration filter
    const matchesDuration =
      filters.duration.length === 0 ||
      (filters.duration.includes("short") && workout.duration <= 1800) || // 30 minutes
      (filters.duration.includes("medium") &&
        workout.duration > 1800 &&
        workout.duration <= 3600) || // 30-60 minutes
      (filters.duration.includes("long") && workout.duration > 3600); // > 60 minutes

    return (
      matchesSearch &&
      matchesTimeRange &&
      matchesCompletion &&
      matchesCategory &&
      matchesDuration
    );
  });

  const calculateStats = () => {
    if (workouts.length === 0) return null;

    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalExercises = workouts.reduce(
      (sum, w) => sum + w.exercises_completed,
      0
    );
    const avgCompletion =
      workouts.reduce(
        (sum, w) => sum + w.exercises_completed / w.total_exercises,
        0
      ) / workouts.length;

    return {
      totalWorkouts: workouts.length,
      totalDuration,
      totalExercises,
      avgCompletion: Math.round(avgCompletion * 100),
    };
  };

  const stats = calculateStats();

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="hidden sm:block">
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
              <BreadcrumbLink href="/training">Training</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/History.jpg"
            alt="Workout History"
            fill
            className="object-cover opacity-15"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/20" />
        </div>
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 backdrop-blur-sm p-3">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Workout History
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Track your fitness journey and progress over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Workouts
              </CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Duration
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(stats.totalDuration)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Exercises
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExercises}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Completion
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCompletion}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 rounded-md border bg-background"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilters.length}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
              <DropdownMenuLabel>Time Range</DropdownMenuLabel>
              {[
                { label: "Today", value: "today" },
                { label: "This Week", value: "week" },
                { label: "This Month", value: "month" },
              ].map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.timeRange.includes(option.value)}
                  onCheckedChange={() =>
                    toggleFilter("timeRange", option.value)
                  }
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Completion</DropdownMenuLabel>
              {[
                { label: "Completed", value: "complete" },
                { label: "Partial", value: "partial" },
              ].map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.completion.includes(option.value)}
                  onCheckedChange={() =>
                    toggleFilter("completion", option.value)
                  }
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              {getUniqueCategories().map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.category.includes(category)}
                  onCheckedChange={() => toggleFilter("category", category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Duration</DropdownMenuLabel>
              {[
                { label: "Short (≤30min)", value: "short" },
                { label: "Medium (30-60min)", value: "medium" },
                { label: "Long (>60min)", value: "long" },
              ].map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.duration.includes(option.value)}
                  onCheckedChange={() => toggleFilter("duration", option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            className="h-9"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            className="h-9"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {filter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  Object.keys(filters).forEach((key) => {
                    if (filters[key as keyof typeof filters].includes(filter)) {
                      toggleFilter(key as keyof typeof filters, filter);
                    }
                  });
                }}
              />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Workout History Display */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="animate-spin">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p>Loading history...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredWorkouts.length > 0 ? (
        viewMode === "list" ? (
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => (
              <Card
                key={workout.id}
                className="bg-gradient-to-br from-card to-card/50 border-border/50"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {workout.program.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {workout.program.recurrence?.repeat || "one-time"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {workout.program.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-sm font-medium">
                        {formatDate(workout.completed_at)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(workout.duration)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {workout.exercises_completed} of{" "}
                        {workout.total_exercises} exercises
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {Math.round(
                          (workout.exercises_completed /
                            workout.total_exercises) *
                            100
                        )}
                        % completion
                      </span>
                    </div>
                  </div>

                  {workout.notes && (
                    <div className="mt-4 p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        {workout.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkouts.map((workout) => (
              <Card
                key={workout.id}
                className="bg-gradient-to-br from-card to-card/50 border-border/50"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{workout.program.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {workout.program.recurrence?.repeat || "one-time"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workout.program.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(workout.completed_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(workout.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {workout.exercises_completed}/{workout.total_exercises}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {Math.round(
                          (workout.exercises_completed /
                            workout.total_exercises) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  {workout.notes && (
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {workout.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No workout history found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery || activeFilters.length > 0
                ? "Try adjusting your search or filters to see more workouts."
                : "Complete your first workout to start tracking your progress."}
            </p>
            {(searchQuery || activeFilters.length > 0) && (
              <div className="flex gap-2 mt-6">
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
                {activeFilters.length > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
