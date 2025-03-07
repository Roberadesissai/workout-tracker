"use client";

import {
  Shield,
  Home,
  Lock,
  Eye,
  Bell,
  Key,
  UserX,
  History,
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function PrivacySecurityPage() {
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    profileVisibility: "public",
    activityVisibility: "friends",
    emailNotifications: true,
    pushNotifications: true,
    dataSharing: false,
  });

  const handleSettingChange = (setting: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [setting]: value }));
    toast.success("Setting updated successfully");
  };

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
            <BreadcrumbPage>Privacy & Security</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0">
          <Image
            src="/images/profile/Privacy_SecurityFitness_Infused_ProtectionPrivacy_Security_Fitness_Infused_Protection.jpg"
            alt="Privacy and Security"
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
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Privacy & Security
              </h1>
            </div>
            <p className="text-muted-foreground">
              Manage your account security and privacy preferences
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/profile/Privacy_SecurityFitness_Infused_ProtectionPrivacy_Security_Fitness_Infused_Protection.jpg"
              alt="Privacy and Security"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <Label className="text-base">Two-Factor Authentication</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={settings.twoFactorEnabled}
              onCheckedChange={(checked) =>
                handleSettingChange("twoFactorEnabled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between pt-6">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <Label className="text-base">Login History</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Review your recent login activity
              </p>
            </div>
            <Button variant="outline">View History</Button>
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <Label className="text-base">Profile Visibility</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Control who can see your profile and activities
              </p>
            </div>
            <Switch
              checked={settings.profileVisibility === "public"}
              onCheckedChange={(checked) =>
                handleSettingChange(
                  "profileVisibility",
                  checked ? "public" : "private"
                )
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-primary" />
                <Label className="text-base">Blocked Users</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your blocked users list
              </p>
            </div>
            <Button variant="outline">Manage List</Button>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Notification Privacy</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <Label className="text-base">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                handleSettingChange("emailNotifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <Label className="text-base">Push Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications on your device
              </p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                handleSettingChange("pushNotifications", checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Data Privacy */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Data Privacy</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <Label className="text-base">Data Sharing</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow sharing of workout data with third-party apps
              </p>
            </div>
            <Switch
              checked={settings.dataSharing}
              onCheckedChange={(checked) =>
                handleSettingChange("dataSharing", checked)
              }
            />
          </div>

          <div className="pt-4">
            <Button variant="destructive" className="w-full sm:w-auto">
              Request Data Export
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
