"use client";

import {
  Dumbbell,
  Home,
  Plus,
  Filter,
  Calendar,
  PlayCircle,
  LayoutGrid,
  List,
  Clock,
  X,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkoutExerciseData {
  id: string;
  sets: number;
  reps: string;
  exercise: {
    id: string;
    name: string;
    category: string;
  } | null;
}

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  recurrence: {
    repeat: "none" | "daily" | "weekly" | "monthly";
    startTime: string;
    days: number[];
    duration: number;
  } | null;
  exercises: {
    id: string;
    name: string;
    sets: number;
    reps: string;
    category: string;
  }[];
}

export default function WorkoutsPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    categories: [] as string[],
    frequency: [] as string[],
    duration: [] as string[],
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to view your workouts");
        return;
      }

      console.log("Fetching workouts for user:", user.id);

      const { data: programs, error } = await supabase
        .from("workout_programs")
        .select(
          `
          *,
          workout_exercises:workout_exercises(
            id,
            sets,
            reps,
            exercise:exercises(
              id,
              name,
              category
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workouts:", error);
        toast.error("Failed to fetch workouts");
        return;
      }

      console.log("Fetched programs:", programs);

      const formattedPrograms = programs.map((program) => ({
        id: program.id,
        name: program.name,
        description: program.description,
        recurrence: program.recurrence,
        exercises: program.workout_exercises.map((ex: WorkoutExerciseData) => ({
          id: ex.id,
          name: ex.exercise?.name || "Unknown Exercise",
          sets: ex.sets || 3,
          reps: ex.reps || "8-12",
          category: ex.exercise?.category || "other",
        })),
      }));

      setWorkouts(formattedPrograms);
    } catch (err) {
      console.error("Error in fetchWorkouts:", err);
      toast.error("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = (programId: string) => {
    router.push(`/training/workout?program=${programId}`);
  };

  const createWorkout = () => {
    router.push("/training/planner");
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        if (exercise.category) categories.add(exercise.category);
      });
    });
    return Array.from(categories);
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

    // Update active filters for display
    setActiveFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      frequency: [],
      duration: [],
    });
    setActiveFilters([]);
  };

  const filteredWorkouts = workouts.filter((workout) => {
    // Text search
    const matchesSearch =
      searchQuery === "" ||
      workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      filters.categories.length === 0 ||
      workout.exercises.some((ex) => filters.categories.includes(ex.category));

    // Frequency filter
    const matchesFrequency =
      filters.frequency.length === 0 ||
      (workout.recurrence &&
        filters.frequency.includes(workout.recurrence.repeat));

    // Duration filter (you can customize the duration ranges)
    const matchesDuration =
      filters.duration.length === 0 ||
      (workout.recurrence &&
        filters.duration.includes(
          workout.recurrence.duration <= 30
            ? "short"
            : workout.recurrence.duration <= 60
            ? "medium"
            : "long"
        ));

    return (
      matchesSearch && matchesCategory && matchesFrequency && matchesDuration
    );
  });

  const getDayNames = (days: number[]) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((day) => dayNames[day]).join(", ");
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/dashboard"
              className="flex items-center gap-1"
            >
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
            <BreadcrumbPage>Workouts</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/Workouts.jpg"
            alt="Workouts"
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
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Workouts
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Create and manage your workout routines.
                </p>
              </div>
            </div>
            <Button
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              onClick={createWorkout}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Workout
            </Button>
          </div>
        </div>
      </div>

      {/* Search, Filter, and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search workouts..."
              className="pl-4 h-9 bg-muted/80 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Sheet for Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 sm:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                <div className="space-y-6 pt-4">
                  {/* Categories */}
                  <div>
                    <h4 className="font-medium mb-2">Categories</h4>
                    <div className="space-y-2">
                      {getUniqueCategories().map((category) => (
                        <Button
                          key={category}
                          variant={
                            filters.categories.includes(category)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="mr-2"
                          onClick={() => toggleFilter("categories", category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <h4 className="font-medium mb-2">Frequency</h4>
                    <div className="space-y-2">
                      {["daily", "weekly", "monthly"].map((freq) => (
                        <Button
                          key={freq}
                          variant={
                            filters.frequency.includes(freq)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="mr-2 capitalize"
                          onClick={() => toggleFilter("frequency", freq)}
                        >
                          {freq}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <h4 className="font-medium mb-2">Duration</h4>
                    <div className="space-y-2">
                      {[
                        { label: "Short (≤30min)", value: "short" },
                        { label: "Medium (30-60min)", value: "medium" },
                        { label: "Long (>60min)", value: "long" },
                      ].map((duration) => (
                        <Button
                          key={duration.value}
                          variant={
                            filters.duration.includes(duration.value)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="mr-2"
                          onClick={() =>
                            toggleFilter("duration", duration.value)
                          }
                        >
                          {duration.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Filter Dropdown for Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 hidden sm:flex"
              >
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
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              {getUniqueCategories().map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => toggleFilter("categories", category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Frequency</DropdownMenuLabel>
              {["daily", "weekly", "monthly"].map((freq) => (
                <DropdownMenuCheckboxItem
                  key={freq}
                  checked={filters.frequency.includes(freq)}
                  onCheckedChange={() => toggleFilter("frequency", freq)}
                  className="capitalize"
                >
                  {freq}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Duration</DropdownMenuLabel>
              {[
                { label: "Short (≤30min)", value: "short" },
                { label: "Medium (30-60min)", value: "medium" },
                { label: "Long (>60min)", value: "long" },
              ].map((duration) => (
                <DropdownMenuCheckboxItem
                  key={duration.value}
                  checked={filters.duration.includes(duration.value)}
                  onCheckedChange={() =>
                    toggleFilter("duration", duration.value)
                  }
                >
                  {duration.label}
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
          <span className="text-sm text-muted-foreground">Active filters:</span>
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

      {/* Workouts Display */}
      {loading ? (
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="animate-spin">
                <Dumbbell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p>Loading workouts...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredWorkouts.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkouts.map((workout) => (
              <Card
                key={workout.id}
                className="bg-gradient-to-br from-card to-card/50 border-border/50"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{workout.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startWorkout(workout.id)}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {workout.description}
                  </p>

                  {workout.recurrence && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {workout.recurrence.repeat === "daily"
                          ? "Daily"
                          : workout.recurrence.repeat === "weekly"
                          ? "Weekly"
                          : workout.recurrence.repeat === "monthly"
                          ? "Monthly"
                          : "One-time"}{" "}
                        at {workout.recurrence.startTime}
                        {workout.recurrence.days?.length > 0 && (
                          <span className="ml-1">
                            on {getDayNames(workout.recurrence.days)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Exercises:</span>
                      <span>{workout.exercises.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {workout.exercises.slice(0, 3).map((exercise) => (
                        <span
                          key={exercise.id}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                        >
                          {exercise.name}
                        </span>
                      ))}
                      {workout.exercises.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{workout.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
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
                          {workout.name}
                        </h3>
                        {workout.recurrence && (
                          <Badge variant="outline" className="text-xs">
                            {workout.recurrence.repeat}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {workout.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => startWorkout(workout.id)}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start Workout
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {workout.recurrence?.startTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {workout.exercises.length} exercises
                      </span>
                    </div>
                    {workout.recurrence?.days && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getDayNames(workout.recurrence.days)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {workout.exercises.map((exercise) => (
                      <span
                        key={exercise.id}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                      >
                        {exercise.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card className="col-span-full bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No workouts found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {activeFilters.length > 0
                ? "Try adjusting your filters or search query."
                : "Create your first workout routine to get started with your fitness journey."}
            </p>
            {activeFilters.length > 0 ? (
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button
                className="mt-6 bg-primary hover:bg-primary/90"
                onClick={createWorkout}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Workout
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
