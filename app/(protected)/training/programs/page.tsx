"use client";

import { Dumbbell, Home, Filter, Plus, Clock, Target } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase/client";

interface Program {
  id: string;
  title: string;
  description: string;
  duration_weeks: number;
  difficulty: string;
  category: string;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data } = await supabase
        .from("workout_programs")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setPrograms(data);
      }
    };

    fetchPrograms();
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
            <BreadcrumbLink href="/training">Training</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Programs</BreadcrumbPage>
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
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Workout Programs
              </h1>
            </div>
            <p className="text-muted-foreground">
              Discover structured workout programs tailored to your fitness
              goals.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Programs.jpg"
              alt="Workout Programs"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input placeholder="Search programs..." className="flex-1" />
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Program
        </Button>
      </div>

      {/* Program Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Programs
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Ready to start</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Duration
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs.length
                ? Math.round(
                    programs.reduce(
                      (acc, prog) => acc + prog.duration_weeks,
                      0
                    ) / programs.length
                  )
                : 0}{" "}
              weeks
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Per program</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Programs
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="mt-1 text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Programs Grid */}
      <div className="grid gap-4">
        {programs.length === 0 ? (
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Dumbbell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No Programs Available
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                Create your first workout program or browse our collection of
                pre-made programs.
              </p>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <Card
                key={program.id}
                className="bg-gradient-to-br from-card to-card/50 border-border/50"
              >
                <CardHeader>
                  <CardTitle>{program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {program.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {program.duration_weeks} weeks
                    </span>
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {program.difficulty}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
