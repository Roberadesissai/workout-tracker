"use client";

import { Palette, Home, Sun, Moon, Monitor } from "lucide-react";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

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
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Appearance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0">
          <Image
            src="/images/profile/Appearance_Customization_Personalization.jpg"
            alt="Appearance Settings"
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
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
            </div>
            <p className="text-muted-foreground">
              Customize your interface theme and visual preferences
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/profile/Appearance_Customization_Personalization.jpg"
              alt="Appearance Settings"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Theme Preferences</h3>
        <div className="space-y-6">
          <div>
            <RadioGroup
              defaultValue={theme}
              onValueChange={(value) => {
                setTheme(value);
                toast.success(`Theme changed to ${value} mode`);
              }}
              className="grid gap-4 pt-2"
            >
              <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent">
                <RadioGroupItem value="light" id="light" />
                <Label
                  htmlFor="light"
                  className="flex flex-1 items-center gap-4"
                >
                  <Sun className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Light Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use light theme for better visibility in bright
                      environments
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent">
                <RadioGroupItem value="dark" id="dark" />
                <Label
                  htmlFor="dark"
                  className="flex flex-1 items-center gap-4"
                >
                  <Moon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for reduced eye strain in low-light
                      conditions
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent">
                <RadioGroupItem value="system" id="system" />
                <Label
                  htmlFor="system"
                  className="flex flex-1 items-center gap-4"
                >
                  <Monitor className="h-5 w-5" />
                  <div>
                    <p className="font-medium">System</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically match your system's theme preferences
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Card>

      {/* Additional Appearance Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Customization</h3>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            More appearance customization options coming soon...
          </p>
        </div>
      </Card>
    </div>
  );
}
