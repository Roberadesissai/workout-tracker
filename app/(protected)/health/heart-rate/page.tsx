"use client";

import { Heart, Home, Activity, Timer, Target } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/utils/supabase/client";

interface HeartRateData {
  currentBPM: number;
  maxBPM: number;
  minBPM: number;
  avgBPM: number;
  restingBPM: number;
  zones: {
    rest: number;
    light: number;
    cardio: number;
    peak: number;
  };
}

export default function HeartRatePage() {
  const [heartRateData, setHeartRateData] = useState<HeartRateData>({
    currentBPM: 0,
    maxBPM: 0,
    minBPM: 0,
    avgBPM: 0,
    restingBPM: 0,
    zones: {
      rest: 0,
      light: 0,
      cardio: 0,
      peak: 0,
    },
  });

  useEffect(() => {
    const fetchHeartRateData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("heart_rate_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", new Date().toISOString().split("T")[0])
          .single();

        if (data) {
          setHeartRateData(data);
        }
      }
    };

    fetchHeartRateData();
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
            <BreadcrumbLink href="/health">Health</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Heart Rate</BreadcrumbPage>
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
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Heart Rate Monitor
              </h1>
            </div>
            <p className="text-muted-foreground">
              Track your heart rate in real-time and monitor your cardiovascular
              health.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Heart_Rate.jpg"
              alt="Heart Rate Monitor"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Heart Rate Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current BPM</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Heart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {heartRateData.currentBPM || "--"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Beats per minute
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resting HR</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Timer className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {heartRateData.restingBPM || "--"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Average resting rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max HR Today</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {heartRateData.maxBPM || "--"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Peak heart rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average HR</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {heartRateData.avgBPM || "--"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Daily average</p>
          </CardContent>
        </Card>
      </div>

      {/* Heart Rate Zones */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Heart Rate Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Peak Zone (85-100%)</span>
                <span className="font-medium">
                  {heartRateData.zones.peak} min
                </span>
              </div>
              <Progress value={heartRateData.zones.peak} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Cardio Zone (70-84%)</span>
                <span className="font-medium">
                  {heartRateData.zones.cardio} min
                </span>
              </div>
              <Progress value={heartRateData.zones.cardio} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Light Zone (50-69%)</span>
                <span className="font-medium">
                  {heartRateData.zones.light} min
                </span>
              </div>
              <Progress value={heartRateData.zones.light} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Rest Zone (0-49%)</span>
                <span className="font-medium">
                  {heartRateData.zones.rest} min
                </span>
              </div>
              <Progress value={heartRateData.zones.rest} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heart Rate Chart */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Heart Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Heart Rate Data</h3>
              <p className="text-sm text-muted-foreground">
                Connect your heart rate monitor to see real-time data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
