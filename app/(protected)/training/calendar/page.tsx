"use client";

import {
  Calendar as CalendarIcon,
  Home,
  Plus,
  ChevronLeft,
  ChevronRight,
  Star,
  Dumbbell,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { FormProvider } from "react-hook-form";

interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string | null;
  event_type: "workout" | "nutrition" | "rest" | "other";
  created_at: string;
}

const workoutFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string(),
  duration: z.string().min(1, "Duration is required"),
  type: z.enum(["workout", "nutrition", "rest", "other"]),
});

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);

  const form = useForm<z.infer<typeof workoutFormSchema>>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "workout",
      duration: "60",
    },
  });

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      );

      const { data, error } = await supabase
        .from("scheduled_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", startOfMonth.toISOString())
        .lte("start_time", endOfMonth.toISOString());

      if (error) {
        toast.error("Failed to fetch events");
        return;
      }

      if (data) {
        setEvents(data);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof workoutFormSchema>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in to schedule workouts");
      return;
    }

    const startTime = new Date(values.date);
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + parseInt(values.duration));

    const { error } = await supabase.from("scheduled_events").insert({
      user_id: user.id,
      title: values.title,
      description: values.description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      event_type: values.type,
    });

    if (error) {
      toast.error("Failed to schedule workout");
      return;
    }

    toast.success("Workout scheduled successfully");
    setIsAddingWorkout(false);
    fetchEvents();
    form.reset();
  };

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

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
            <BreadcrumbLink href="/training">Training</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Calendar</BreadcrumbPage>
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
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Workout Calendar
              </h1>
            </div>
            <p className="text-muted-foreground">
              Schedule and track your workouts with our interactive calendar.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Calendar.jpg"
              alt="Workout Calendar"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            className="ml-4 flex items-center gap-2"
            onClick={() => router.push("/training/planner")}
          >
            <Plus className="h-4 w-4" />
            Create Workout Plan
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-medium text-sm">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                i + 1
              );
              const dayEvents = events.filter(
                (event) =>
                  new Date(event.start_time).toDateString() ===
                  date.toDateString()
              );
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={i}
                  className={cn(
                    "h-24 p-2 border rounded-lg hover:bg-muted/50 transition-colors relative cursor-pointer",
                    isToday && "border-primary",
                    dayEvents.length > 0 && "bg-primary/5"
                  )}
                  onClick={() => router.push("/training/planner")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{i + 1}</span>
                    {isToday && (
                      <Star className="h-4 w-4 text-primary fill-primary" />
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded flex items-center gap-1",
                          event.event_type === "workout" &&
                            "bg-primary/10 text-primary",
                          event.event_type === "nutrition" &&
                            "bg-green-500/10 text-green-500",
                          event.event_type === "rest" &&
                            "bg-blue-500/10 text-blue-500",
                          event.event_type === "other" &&
                            "bg-orange-500/10 text-orange-500"
                        )}
                      >
                        {event.event_type === "workout" && (
                          <Dumbbell className="h-3 w-3" />
                        )}
                        {event.event_type === "nutrition" && <span>🍎</span>}
                        {event.event_type === "rest" && <span>😴</span>}
                        {event.event_type === "other" && <span>📌</span>}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Workouts */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Upcoming Events</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule your next workout to stay on track with your fitness
                goals.
              </p>
              <Button
                className="flex items-center gap-2"
                onClick={() => router.push("/training/planner")}
              >
                <Plus className="h-4 w-4" />
                Create Workout Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events
                .filter((event) => new Date(event.start_time) >= new Date())
                .sort(
                  (a, b) =>
                    new Date(a.start_time).getTime() -
                    new Date(b.start_time).getTime()
                )
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      event.event_type === "workout" && "bg-primary/5",
                      event.event_type === "nutrition" && "bg-green-500/5",
                      event.event_type === "rest" && "bg-blue-500/5",
                      event.event_type === "other" && "bg-orange-500/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2",
                          event.event_type === "workout" && "bg-primary/10",
                          event.event_type === "nutrition" && "bg-green-500/10",
                          event.event_type === "rest" && "bg-blue-500/10",
                          event.event_type === "other" && "bg-orange-500/10"
                        )}
                      >
                        {event.event_type === "workout" && (
                          <Dumbbell className="h-4 w-4 text-primary" />
                        )}
                        {event.event_type === "nutrition" && (
                          <span className="text-lg">🍎</span>
                        )}
                        {event.event_type === "rest" && (
                          <span className="text-lg">😴</span>
                        )}
                        {event.event_type === "other" && (
                          <span className="text-lg">📌</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.start_time), "PPP")} at{" "}
                          {format(new Date(event.start_time), "p")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (
                          confirm("Are you sure you want to delete this event?")
                        ) {
                          const { error } = await supabase
                            .from("scheduled_events")
                            .delete()
                            .eq("id", event.id);

                          if (error) {
                            toast.error("Failed to delete event");
                            return;
                          }

                          toast.success("Event deleted successfully");
                          fetchEvents();
                        }
                      }}
                    >
                      <span className="sr-only">Delete event</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
