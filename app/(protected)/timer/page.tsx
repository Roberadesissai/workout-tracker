"use client";

import { Timer, Home, Play, Pause, RotateCcw } from "lucide-react";
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

export default function TimerPage() {
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
                <Timer className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Workout Timer
              </h1>
            </div>
            <p className="text-muted-foreground">
              Track your workout duration and rest periods with precision.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Close_Up_Power_Grip.jpg"
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
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-7xl font-bold tracking-tighter mb-8">
            00:00:00
          </div>
          <div className="flex gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
            <Button size="lg" variant="outline">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button size="lg" variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timer Presets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Quick Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              1 Minute
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Rest Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              30 Seconds
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle>HIIT Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Tabata (4 min)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Custom Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Set Custom
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Timer History */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Recent Timers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="text-center">
              <p className="text-sm font-medium">No timer history</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your recent timer sessions will appear here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
