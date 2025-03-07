"use client";

import {
  UserCircle,
  Home,
  Target,
  Clock,
  Crown,
  Award,
  Upload,
  Sparkles,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  generateOrImproveBio,
  generateOrImproveQuote,
} from "@/utils/ai-client";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  email: string | null;
  location: string | null;
  fitness_level: string | null;
  preferred_workout: string | null;
  role: "trainer" | "athlete" | null;
  is_profile_private: boolean;
  display_option: "email" | "username" | "full_name";
  fitness_goals: string[] | null;
  preferred_workout_types: string[] | null;
  training_split: string | null;
  primary_fitness_focus: string | null;
  equipment_access: string[] | null;
  motivational_quote: string | null;
  certification_badges: string[] | null;
  preferred_workout_duration: number | null;
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  achievements_count: number;
  personal_records: number;
  total_workout_hours: number;
}

const FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];

const TRAINING_SPLITS = [
  "Full Body",
  "Upper/Lower",
  "Push/Pull/Legs",
  "Body Part Split",
  "Custom",
];

const FITNESS_FOCUSES = [
  "Muscle Gain",
  "Weight Loss",
  "Endurance",
  "Strength",
  "Flexibility",
  "General Fitness",
];

const EQUIPMENT_OPTIONS = [
  "Home Gym",
  "Commercial Gym",
  "Bodyweight Only",
  "Resistance Bands",
  "Free Weights",
  "Machines",
  "Cardio Equipment",
];

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    id: "",
    full_name: "",
    username: "",
    avatar_url: "",
    cover_url: "",
    bio: "",
    email: "",
    location: "",
    fitness_level: "",
    preferred_workout: "",
    role: null,
    is_profile_private: false,
    display_option: "full_name",
    fitness_goals: [],
    preferred_workout_types: [],
    training_split: "",
    primary_fitness_focus: "",
    equipment_access: [],
    motivational_quote: "",
    certification_badges: [],
    preferred_workout_duration: 0,
    age: null,
    gender: "",
    weight: null,
    height: null,
    achievements_count: 0,
    personal_records: 0,
    total_workout_hours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setProfile(
            profileData || {
              ...profile,
              id: user.id,
              email: user.email,
            }
          );
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleChange = (name: string) => {
    setProfile((prev) => ({
      ...prev,
      [name]: !prev[name as keyof Profile],
    }));
  };

  const handleDisplayOptionChange = (
    option: "email" | "username" | "full_name"
  ) => {
    setProfile((prev) => ({
      ...prev,
      display_option: option,
    }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!profile.id) {
        throw new Error("Profile ID is required");
      }

      // Convert numeric strings to numbers and ensure arrays are properly formatted
      const updateData = {
        id: profile.id,
        full_name: profile.full_name || null,
        username: profile.username || null,
        bio: profile.bio || null,
        location: profile.location || null,
        fitness_level: profile.fitness_level || null,
        preferred_workout: profile.preferred_workout || null,
        role: profile.role || null,
        is_profile_private: Boolean(profile.is_profile_private),
        display_option: profile.display_option || "full_name",
        fitness_goals: Array.isArray(profile.fitness_goals)
          ? profile.fitness_goals
          : [],
        preferred_workout_types: Array.isArray(profile.preferred_workout_types)
          ? profile.preferred_workout_types
          : [],
        training_split: profile.training_split || null,
        primary_fitness_focus: profile.primary_fitness_focus || null,
        equipment_access: Array.isArray(profile.equipment_access)
          ? profile.equipment_access
          : [],
        motivational_quote: profile.motivational_quote || null,
        preferred_workout_duration: profile.preferred_workout_duration
          ? Number(profile.preferred_workout_duration)
          : null,
        age: profile.age ? Number(profile.age) : null,
        gender: profile.gender || null,
        weight: profile.weight ? Number(profile.weight) : null,
        height: profile.height ? Number(profile.height) : null,
        updated_at: new Date().toISOString(),
      };

      console.log("Sending update data:", updateData);

      const { data, error } = await supabase
        .from("profiles")
        .upsert(updateData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(error.message || "Failed to update profile");
      }

      if (data) {
        // Update local state with the returned data
        setProfile((prev) => ({
          ...prev,
          ...data,
        }));
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        `Failed to update profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const uploadImage = async (file: File, type: "avatar" | "cover") => {
    try {
      const fileExt = file.name.split(".").pop();
      const bucket = type === "avatar" ? "profile_pictures" : "cover_photos";
      const fileName = `${profile.id}/${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      // Delete existing file if it exists
      if (profile[`${type}_url`]) {
        try {
          const existingUrl = profile[`${type}_url`] as string;
          const pathMatch = existingUrl.match(new RegExp(`${bucket}\\/(.*)`));
          if (pathMatch) {
            await supabase.storage.from(bucket).remove([pathMatch[1]]);
          }
        } catch (error) {
          console.log("Error removing existing file:", error);
          // Continue with upload even if delete fails
        }
      }

      // Upload new file
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!data) {
        throw new Error("Upload failed: No data returned");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      // Update profile with new URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          [`${type}_url`]: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      // Update local state
      setProfile((prev) => ({
        ...prev,
        [`${type}_url`]: publicUrl,
      }));

      toast.success(
        `${
          type === "avatar" ? "Profile picture" : "Cover photo"
        } updated successfully`
      );
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(
        `Failed to upload ${
          type === "avatar" ? "profile picture" : "cover photo"
        }: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleFileSelect = async (type: "avatar" | "cover") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Basic validation
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Size validation (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      await uploadImage(file, type);
    };

    input.click();
  };

  const handleBioGeneration = async () => {
    try {
      if (!profile.bio?.trim()) {
        toast.error("Please enter some text to generate or improve a bio");
        return;
      }

      setIsGeneratingBio(true);
      const generatedBio = await generateOrImproveBio(profile.bio);
      setProfile((prev) => ({
        ...prev,
        bio: generatedBio,
      }));
      toast.success("Bio generated successfully!");
    } catch (error) {
      console.error("Error generating bio:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate bio"
      );
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleQuoteGeneration = async () => {
    try {
      if (!profile.motivational_quote?.trim()) {
        toast.error("Please enter some text to generate or improve a quote");
        return;
      }

      setIsGeneratingQuote(true);
      const generatedQuote = await generateOrImproveQuote(
        profile.motivational_quote
      );
      setProfile((prev) => ({
        ...prev,
        motivational_quote: generatedQuote,
      }));
      toast.success("Quote generated successfully!");
    } catch (error) {
      console.error("Error generating quote:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate quote"
      );
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-4 text-center">
            <div className="animate-spin">
              <UserCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Loading Profile...</h3>
          </div>
        </div>
      ) : (
        <>
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
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Updated Hero Section with Profile */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
            {/* Cover Photo Section */}
            <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full group">
              {profile.cover_url ? (
                <div className="absolute inset-0">
                  <Image
                    src={profile.cover_url}
                    alt="Cover Photo"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-cover"
                    quality={100}
                    priority
                    unoptimized
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No cover photo</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect("cover")}
                className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Change Cover
              </Button>
            </div>

            {/* Profile Section */}
            <div className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 sm:-mt-16">
                <div className="relative group">
                  <div
                    className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-background overflow-hidden cursor-pointer bg-background flex items-center justify-center"
                    onClick={() => handleFileSelect("avatar")}
                  >
                    {profile.avatar_url ? (
                      <div className="absolute inset-0">
                        <Image
                          src={profile.avatar_url}
                          alt="Profile Picture"
                          width={256}
                          height={256}
                          className="w-full h-full object-cover"
                          quality={100}
                          priority
                          unoptimized
                        />
                      </div>
                    ) : (
                      <Avatar className="h-full w-full">
                        <AvatarFallback className="text-4xl">
                          {profile.full_name?.[0] ||
                            profile.username?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-5 w-5 text-white" />
                        <p className="text-white text-sm">Change Photo</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h2 className="text-2xl font-bold">
                      {profile.display_option === "full_name"
                        ? profile.full_name
                        : profile.display_option === "username"
                        ? profile.username
                        : profile.email?.split("@")[0]}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        {profile.role || "Member"}
                      </Badge>
                      {profile.is_profile_private && (
                        <Badge variant="secondary" className="font-normal">
                          Private Profile
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {profile.bio || "No bio added yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {profile.achievements_count}
                  </p>
                  <p className="text-xs text-muted-foreground">Achievements</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Crown className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {profile.personal_records}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Personal Records
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {profile.total_workout_hours}
                  </p>
                  <p className="text-xs text-muted-foreground">Workout Hours</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {profile.fitness_goals?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Fitness Goals</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Settings Form */}
          <div className="grid gap-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Basic Information</h3>
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      name="full_name"
                      placeholder="Enter your full name"
                      value={profile.full_name || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      name="username"
                      placeholder="Choose a username"
                      value={profile.username || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Bio Input Section */}
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </label>
                    <div className="flex gap-2">
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profile.bio || ""}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself... Use quotes for a new bio about a specific topic"
                        className="resize-none h-20"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={handleBioGeneration}
                        disabled={isGeneratingBio}
                      >
                        {isGeneratingBio ? (
                          <div className="animate-spin">⚪</div>
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max 100 characters • Use quotes for a new bio, e.g.
                      "passionate about weightlifting"
                    </p>
                  </div>
                </div>

                {/* Motivational Quote Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Motivational Quote
                  </label>
                  <div className="flex gap-2">
                    <Input
                      name="motivational_quote"
                      placeholder="Enter a quote or use quotes for a new one about a specific topic"
                      value={profile.motivational_quote || ""}
                      onChange={handleInputChange}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={handleQuoteGeneration}
                      disabled={isGeneratingQuote}
                    >
                      {isGeneratingQuote ? (
                        <div className="animate-spin">⚪</div>
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max 50 characters • Use quotes for a new quote, e.g. "never
                    give up"
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    name="location"
                    placeholder="City, Country"
                    value={profile.location || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={profile.email || ""}
                    disabled
                  />
                </div>
              </div>
            </Card>

            {/* Fitness Profile */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Fitness Profile</h3>
              <div className="space-y-6">
                {/* Role and Level */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select
                      value={profile.role || ""}
                      onValueChange={(value) =>
                        handleSelectChange("role", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="athlete">Athlete</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fitness Level</label>
                    <Select
                      value={profile.fitness_level || ""}
                      onValueChange={(value) =>
                        handleSelectChange("fitness_level", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your fitness level" />
                      </SelectTrigger>
                      <SelectContent>
                        {FITNESS_LEVELS.map((level) => (
                          <SelectItem key={level} value={level.toLowerCase()}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Physical Stats */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Age</label>
                    <Input
                      name="age"
                      type="number"
                      placeholder="Years"
                      value={profile.age || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender</label>
                    <Select
                      value={profile.gender || ""}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Height</label>
                    <Input
                      name="height"
                      type="number"
                      placeholder="cm"
                      value={profile.height || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight</label>
                    <Input
                      name="weight"
                      type="number"
                      placeholder="kg"
                      value={profile.weight || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Training Preferences */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Primary Fitness Focus
                  </label>
                  <Select
                    value={profile.primary_fitness_focus || ""}
                    onValueChange={(value) =>
                      handleSelectChange("primary_fitness_focus", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your main focus" />
                    </SelectTrigger>
                    <SelectContent>
                      {FITNESS_FOCUSES.map((focus) => (
                        <SelectItem key={focus} value={focus.toLowerCase()}>
                          {focus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Training Split</label>
                  <Select
                    value={profile.training_split || ""}
                    onValueChange={(value) =>
                      handleSelectChange("training_split", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your training split" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_SPLITS.map((split) => (
                        <SelectItem key={split} value={split.toLowerCase()}>
                          {split}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Preferred Workout Duration (minutes)
                  </label>
                  <Input
                    name="preferred_workout_duration"
                    type="number"
                    placeholder="Minutes"
                    value={profile.preferred_workout_duration || ""}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Equipment Access */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Equipment Access
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((equipment) => (
                      <Badge
                        key={equipment}
                        variant={
                          profile.equipment_access?.includes(equipment)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const newEquipment =
                            profile.equipment_access?.includes(equipment)
                              ? profile.equipment_access.filter(
                                  (e) => e !== equipment
                                )
                              : [
                                  ...(profile.equipment_access || []),
                                  equipment,
                                ];
                          handleSelectChange("equipment_access", newEquipment);
                        }}
                      >
                        {equipment}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Updated Privacy Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Privacy Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      Private Profile
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Only approved followers can see your full profile and
                      activities
                    </p>
                  </div>
                  <Switch
                    checked={profile.is_profile_private}
                    onCheckedChange={() =>
                      handleToggleChange("is_profile_private")
                    }
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">
                    Display Name Preference
                  </label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose how your name appears across the platform
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm">Display Full Name</div>
                        <p className="text-xs text-muted-foreground">
                          {profile.full_name || "No full name set"}
                        </p>
                      </div>
                      <Switch
                        checked={profile.display_option === "full_name"}
                        onCheckedChange={() =>
                          handleDisplayOptionChange("full_name")
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm">Display Username</div>
                        <p className="text-xs text-muted-foreground">
                          {profile.username || "No username set"}
                        </p>
                      </div>
                      <Switch
                        checked={profile.display_option === "username"}
                        onCheckedChange={() =>
                          handleDisplayOptionChange("username")
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm">Display Email</div>
                        <p className="text-xs text-muted-foreground">
                          {profile.email || "No email set"}
                        </p>
                      </div>
                      <Switch
                        checked={profile.display_option === "email"}
                        onCheckedChange={() =>
                          handleDisplayOptionChange("email")
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Save Changes */}
            <div className="flex justify-end gap-4 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
