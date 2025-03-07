"use client";

import {
  Timer as TimerIcon,
  Home,
  Play,
  Pause,
  RotateCcw,
  Plus,
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
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";

interface TimerPreset {
  id: string;
  name: string;
  duration: number;
  type: string;
}

export default function TimerPage() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [presets, setPresets] = useState<TimerPreset[]>([]);

  useEffect(() => {
    const fetchPresets = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("timer_presets")
          .select("*")
          .eq("user_id", user.id);

        if (data) {
          setPresets(data);
        }
      }
    };

    fetchPresets();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
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
            <BreadcrumbLink href="/health">Health</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Timer</BreadcrumbPage>
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
                <TimerIcon className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Workout Timer
              </h1>
            </div>
            <p className="text-muted-foreground">
              Track your workout duration and manage your training intervals
              with precision.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Timer.jpg"
              alt="Workout Timer"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-6xl font-bold tracking-tighter">
              {formatTime(time)}
            </div>
            <div className="flex gap-2">
              {!isRunning ? (
                <Button onClick={handleStart} size="lg" className="w-32">
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  size="lg"
                  className="w-32"
                  variant="secondary"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="w-32"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timer Presets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Timer</CardTitle>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                5 Minutes
              </Button>
              <Button variant="outline" className="w-full justify-start">
                10 Minutes
              </Button>
              <Button variant="outline" className="w-full justify-start">
                15 Minutes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rest Timer</CardTitle>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                30 Seconds
              </Button>
              <Button variant="outline" className="w-full justify-start">
                1 Minute
              </Button>
              <Button variant="outline" className="w-full justify-start">
                2 Minutes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HIIT Timer</CardTitle>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                20s Work / 10s Rest
              </Button>
              <Button variant="outline" className="w-full justify-start">
                30s Work / 30s Rest
              </Button>
              <Button variant="outline" className="w-full justify-start">
                45s Work / 15s Rest
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Timer</CardTitle>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {presets.length > 0 ? (
                presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {preset.name}
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No custom timers yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer History */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Timer History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="text-center">
              <TimerIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Timer History</h3>
              <p className="text-sm text-muted-foreground">
                Your recent timer sessions will appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
