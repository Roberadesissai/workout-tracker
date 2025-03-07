"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scale, Apple, Home, Calculator } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Image from "next/image";
import FoodCatalog from "./components/FoodCatalog";
import NutritionProgress from "./components/NutritionProgress";
import NutritionCalculator from "./components/NutritionCalculator";

export default function NutritionPage() {
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
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
            <BreadcrumbPage>Nutrition</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/Nutrition.jpg"
            alt="Nutrition Calculator"
            fill
            className="object-cover opacity-15"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/20" />
        </div>
        <div className="relative flex flex-col md:flex-row items-center gap-6 p-8">
          <div className="flex-1 min-w-[50%]">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Advanced Nutrition Tracker
              </h1>
            </div>
            <p className="text-muted-foreground">
              Calculate your nutrition needs, track your progress, and explore
              our comprehensive food database.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nutrition Dashboard</CardTitle>
          <CardDescription>
            Track your nutrition and manage your diet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto gap-2 bg-transparent p-0">
              <TabsTrigger
                value="calculator"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-20 rounded-lg bg-muted/50 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted"
              >
                <Calculator className="h-5 w-5" />
                <span className="text-sm font-medium">Calculator</span>
              </TabsTrigger>
              <TabsTrigger
                value="foods"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-20 rounded-lg bg-muted/50 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted"
              >
                <Apple className="h-5 w-5" />
                <span className="text-sm font-medium">Food Database</span>
              </TabsTrigger>
              <TabsTrigger
                value="progress"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-20 rounded-lg bg-muted/50 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted"
              >
                <Scale className="h-5 w-5" />
                <span className="text-sm font-medium">Weight Progress</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="calculator">
                <NutritionCalculator />
              </TabsContent>

              <TabsContent value="foods">
                <FoodCatalog />
              </TabsContent>

              <TabsContent value="progress">
                <NutritionProgress />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
